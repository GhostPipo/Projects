<?php
session_start();
// backend/api.php

$envFile = __DIR__ . '/.env';
$admin_password = '';
if (file_exists($envFile)) {
    $env = parse_ini_file($envFile);
    if (isset($env['ADMIN_PASSWORD'])) {
        $admin_password = $env['ADMIN_PASSWORD'];
    }
}

header("Content-Type: application/json");
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: " . $origin);
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight Request (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$dbFile = __DIR__ . '/database.sqlite';

try {
    // SQLite Verbindung via PDO
    $pdo = new PDO('sqlite:' . $dbFile);
    // Fehler werfen bei Problemen
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Tabelle initialisieren, falls nicht vorhanden
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sheets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            data TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // --- MIGRATION ---
    // Spalte 'deleted_at' für Soft-Delete hinzufügen, falls sie noch nicht existiert
    $columns = $pdo->query("PRAGMA table_info(sheets)")->fetchAll(PDO::FETCH_ASSOC);
    $hasDeletedAt = false;
    $hasCustomerNumber = false;
    foreach ($columns as $column) {
        if ($column['name'] === 'deleted_at') {
            $hasDeletedAt = true;
        }
        if ($column['name'] === 'customer_number') {
            $hasCustomerNumber = true;
        }
    }
    if (!$hasDeletedAt) {
        $pdo->exec("ALTER TABLE sheets ADD COLUMN deleted_at DATETIME DEFAULT NULL");
    }
    if (!$hasCustomerNumber) {
        $pdo->exec("ALTER TABLE sheets ADD COLUMN customer_number TEXT DEFAULT NULL");
    }

    // Tabelle 'invoices' initialisieren
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sheet_id INTEGER NOT NULL,
            invoice_number TEXT UNIQUE NOT NULL,
            customer_name TEXT,
            street TEXT,
            zip_city TEXT,
            uid TEXT,
            discount_percent INTEGER DEFAULT 0,
            total_net REAL DEFAULT 0,
            total_tax REAL DEFAULT 0,
            total_gross REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sheet_id) REFERENCES sheets(id)
        )
    ");

    // Spalte 'file_path' zu invoices hinzufügen, falls sie fehlt
    $columnsInvoices = $pdo->query("PRAGMA table_info(invoices)")->fetchAll(PDO::FETCH_ASSOC);
    $hasFilePath = false;
    foreach ($columnsInvoices as $col) {
        if ($col['name'] === 'file_path') {
            $hasFilePath = true;
            break;
        }
    }
    if (!$hasFilePath) {
        $pdo->exec("ALTER TABLE invoices ADD COLUMN file_path TEXT DEFAULT NULL");
    }
    
    // --- AUTO-CLEANUP (Trigger on Request) ---
    // Löscht alle Sheets endgültig, die älter als 30 Tage sind, 
    // ODER deren deleted_at älter als 7 Tage ist
    $pdo->exec("DELETE FROM sheets WHERE created_at <= datetime('now', '-30 days') OR (deleted_at IS NOT NULL AND deleted_at <= datetime('now', '-7 days'))");
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Datenbank-Verbindungsfehler: " . $e->getMessage()]);
    exit();
}

// Request-Parsing
$method = $_SERVER['REQUEST_METHOD'];
// Unterstützt Aufrufe via GET Parameter (?action=login oder ?id=123) als Fallback für PATH_INFO
$pathInfo = isset($_SERVER['PATH_INFO']) ? trim($_SERVER['PATH_INFO'], '/') : '';
$action = isset($_GET['action']) ? $_GET['action'] : ($pathInfo === 'login' ? 'login' : '');
$idRaw = isset($_GET['id']) ? $_GET['id'] : $pathInfo;
$id = $idRaw !== '' && $idRaw !== 'login' ? intval($idRaw) : null;

// JSON-Body lesen (für POST und PUT)
$input = json_decode(file_get_contents('php://input'), true);

// --- LOGIN ROUTE ---
if ($method === 'POST' && $action === 'login') {
    if (isset($input['password']) && $input['password'] === $admin_password) {
        $_SESSION['logged_in'] = true;
        echo json_encode(["success" => true]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Falsches Passwort"]);
    }
    exit();
}

// --- AUTHENTIFIZIERUNGS-CHECK FÜR ALLE ANDEREN ROUTEN ---
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(["error" => "Nicht eingeloggt"]);
    exit();
}

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM sheets WHERE deleted_at IS NULL ORDER BY created_at DESC");
        $sheets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // JSON-Strings wieder in Arrays umwandeln fürs Frontend
        foreach ($sheets as &$sheet) {
            $sheet['data'] = json_decode($sheet['data'], true) ?: [];
        }
        
        echo json_encode($sheets);
        break;
        
    case 'POST':
        // --- ROUTE: Rechnung speichern ---
        if ($action === 'save_invoice') {
            $sheet_id = isset($input['sheet_id']) ? intval($input['sheet_id']) : null;
            if (!$sheet_id) {
                http_response_code(400);
                echo json_encode(["error" => "Sheet ID ist erforderlich"]);
                exit();
            }

            // Get customer number
            $stmt = $pdo->prepare("SELECT customer_number FROM sheets WHERE id = :id");
            $stmt->execute([':id' => $sheet_id]);
            $sheet = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$sheet) {
                http_response_code(404);
                echo json_encode(["error" => "Sheet nicht gefunden"]);
                exit();
            }
            $customer_number = $sheet['customer_number'];

            // Generate invoice number RE-[JAHR]-1000
            $year = date('Y');
            $prefix = "RE-{$year}-";
            $stmt = $pdo->prepare("SELECT MAX(CAST(SUBSTR(invoice_number, 9) AS INTEGER)) as max_num FROM invoices WHERE invoice_number LIKE :prefix");
            $stmt->execute([':prefix' => $prefix . '%']);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $max_num = $row['max_num'] ? intval($row['max_num']) : 999;
            $new_num = $max_num + 1;
            $invoice_number = $prefix . $new_num;

            // Save to invoices
            $stmt = $pdo->prepare("
                INSERT INTO invoices (
                    sheet_id, invoice_number, customer_name, street, zip_city, uid,
                    discount_percent, total_net, total_tax, total_gross
                ) VALUES (
                    :sheet_id, :invoice_number, :customer_name, :street, :zip_city, :uid,
                    :discount_percent, :total_net, :total_tax, :total_gross
                )
            ");
            $stmt->execute([
                ':sheet_id' => $sheet_id,
                ':invoice_number' => $invoice_number,
                ':customer_name' => $input['customer_name'] ?? '',
                ':street' => $input['street'] ?? '',
                ':zip_city' => $input['zip_city'] ?? '',
                ':uid' => $input['uid'] ?? '',
                ':discount_percent' => $input['discount_percent'] ?? 0,
                ':total_net' => $input['total_net'] ?? 0,
                ':total_tax' => $input['total_tax'] ?? 0,
                ':total_gross' => $input['total_gross'] ?? 0
            ]);

            echo json_encode([
                "invoice_number" => $invoice_number,
                "customer_number" => $customer_number
            ]);
            break;
        }

        // --- ROUTE: PDF Upload ---
        if ($action === 'upload_pdf') {
            $invoice_number = isset($input['invoice_number']) ? trim($input['invoice_number']) : null;
            $pdf_base64 = isset($input['pdf_base64']) ? $input['pdf_base64'] : null;

            if (!$invoice_number || !$pdf_base64) {
                http_response_code(400);
                echo json_encode(["error" => "Fehlende Daten"]);
                exit();
            }

            // Data URI Header entfernen
            if (strpos($pdf_base64, ',') !== false) {
                $pdf_base64 = explode(',', $pdf_base64)[1];
            }
            $pdf_decoded = base64_decode($pdf_base64);

            // Verzeichnis erstellen
            $invoicesDir = __DIR__ . '/invoices';
            if (!is_dir($invoicesDir)) {
                mkdir($invoicesDir, 0755, true);
            }

            // Datei speichern
            $fileName = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $invoice_number) . '.pdf';
            $filePath = $invoicesDir . '/' . $fileName;
            file_put_contents($filePath, $pdf_decoded);

            // DB Update
            $relativePath = 'invoices/' . $fileName;
            $stmt = $pdo->prepare("UPDATE invoices SET file_path = :file_path WHERE invoice_number = :invoice_number");
            $stmt->execute([':file_path' => $relativePath, ':invoice_number' => $invoice_number]);

            echo json_encode(["success" => true, "file_path" => $relativePath]);
            break;
        }

        // --- ROUTE: Sheet erstellen ---
        if (!isset($input['name']) || empty(trim($input['name']))) {
            http_response_code(400);
            echo json_encode(["error" => "Name ist erforderlich"]);
            exit();
        }
        
        $name = trim($input['name']);

        // Check if customer_number already exists for this name
        $stmt = $pdo->prepare("SELECT customer_number FROM sheets WHERE name = :name AND customer_number IS NOT NULL LIMIT 1");
        $stmt->execute([':name' => $name]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        $customer_number = null;
        if ($existing && !empty($existing['customer_number'])) {
            $customer_number = $existing['customer_number'];
        } else {
            // Generate new customer number: KD-1000
            $stmt = $pdo->query("SELECT MAX(CAST(SUBSTR(customer_number, 4) AS INTEGER)) as max_num FROM sheets WHERE customer_number LIKE 'KD-%'");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $max_num = $row['max_num'] ? intval($row['max_num']) : 999;
            $new_num = $max_num + 1;
            $customer_number = "KD-" . $new_num;
        }

        $stmt = $pdo->prepare("INSERT INTO sheets (name, data, customer_number) VALUES (:name, '[]', :customer_number)");
        $stmt->execute([':name' => $name, ':customer_number' => $customer_number]);
        $newId = $pdo->lastInsertId();
        
        echo json_encode([
            "id" => $newId,
            "name" => $name,
            "data" => [],
            "customer_number" => $customer_number,
            "created_at" => date("Y-m-d H:i:s") // Ungefähres lokales Datum fürs Frontend
        ]);
        break;
        
    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "ID ist erforderlich"]);
            exit();
        }
        
        $data = isset($input['data']) ? json_encode($input['data']) : '[]';
        
        $stmt = $pdo->prepare("UPDATE sheets SET data = :data WHERE id = :id");
        $stmt->execute([':data' => $data, ':id' => $id]);
        
        echo json_encode(["message" => "Sheet aktualisiert", "changes" => $stmt->rowCount()]);
        break;
        
    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "ID ist erforderlich"]);
            exit();
        }
        
        $stmt = $pdo->prepare("UPDATE sheets SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id");
        $stmt->execute([':id' => $id]);
        
        echo json_encode(["message" => "Sheet in den Papierkorb verschoben", "changes" => $stmt->rowCount()]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["error" => "Methode nicht erlaubt"]);
        break;
}
