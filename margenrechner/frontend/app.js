/**
 * Frontend-Logik für den Margen-Rechner (Phase 3 - API Integration)
 */

let state = {
    isDarkMode: true,
    sheets: [], // Sheets aus der DB
    currentSheetId: null
};

// DOM Elemente
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const loginPasswordInput = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');

const themeToggleBtn = document.getElementById('themeToggle');
const bodyElement = document.body;
const addPartForm = document.getElementById('addPartForm');
const partNameInput = document.getElementById('partName');
const partEVInput = document.getElementById('partEV');
const partUVPInput = document.getElementById('partUVP');
const partsContainer = document.getElementById('partsContainer');
const currentSheetNameElement = document.getElementById('currentSheetName');
const sheetSelect = document.getElementById('sheetSelect');
const newSheetBtn = document.getElementById('newSheetBtn');
const deleteSheetBtn = document.getElementById('deleteSheetBtn');

// Modal Elemente (Phase 3)
const summaryModal = document.getElementById('summaryModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalPartsList = document.getElementById('modalPartsList');
const modalOriginalTotal = document.getElementById('modalOriginalTotal');
const modalFinalTotal = document.getElementById('modalFinalTotal');
const modalDiscountBadge = document.getElementById('modalDiscountBadge');
const copyWhatsAppBtn = document.getElementById('copyWhatsAppBtn');
const openInvoiceModalBtn = document.getElementById('openInvoiceModalBtn');

// Invoice Modal (Phase 3/4)
const invoiceModal = document.getElementById('invoiceModal');
const closeInvoiceModalBtn = document.getElementById('closeInvoiceModalBtn');
const invoiceForm = document.getElementById('invoiceForm');

// Customer Ready Elemente
const customerReadyCheck = document.getElementById('customerReadyCheck');
const customerActionDetails = document.getElementById('customerActionDetails');
const customerDiscountInput = document.getElementById('customerDiscount');
const customerSummaryBtn = document.getElementById('customerSummaryBtn');

// Zusammenfassung Elemente
const totalEVElement = document.getElementById('totalEV');
const totalUVPElement = document.getElementById('totalUVP');
const totalProfitElement = document.getElementById('totalProfit');
const profitMarginElement = document.getElementById('profitMargin');

// API URL (Zeigt nun auf das PHP-Backend)
const API_URL = '../backend/api.php';

/**
 * Initialisierung der App
 */
async function init() {
    setupTheme();
    setupEventListeners();
    await loadSheets();
}

/**
 * Theme Management
 */
function setupTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        state.isDarkMode = savedTheme === 'dark';
    } else {
        state.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
}

function applyTheme() {
    if (state.isDarkMode) {
        bodyElement.classList.add('dark-mode');
        themeToggleBtn.textContent = '☀️';
    } else {
        bodyElement.classList.remove('dark-mode');
        themeToggleBtn.textContent = '🌙';
    }
}

function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
    applyTheme();
}

/**
 * API Aufrufe
 */
async function loadSheets() {
    try {
        const url = `${API_URL}?t=${new Date().getTime()}`;
        const response = await fetch(url, { credentials: 'include' });

        if (response.status === 401) {
            loginScreen.style.display = 'flex';
            appScreen.style.display = 'none';
            return;
        }

        const data = await response.json();
        state.sheets = data;

        loginScreen.style.display = 'none';
        appScreen.style.display = 'flex';

        if (state.sheets.length > 0) {
            // Behalte das aktuelle Sheet bei oder lade das neueste (erstes im Array)
            if (!state.currentSheetId || !state.sheets.find(s => s.id == state.currentSheetId)) {
                state.currentSheetId = state.sheets[0].id;
            }
        } else {
            state.currentSheetId = null;
        }

        renderApp();
    } catch (error) {
        console.error("Fehler beim Laden der Sheets:", error);
        alert("Netzwerk- oder Serverfehler beim Laden der Daten. Bitte API-Pfad prüfen.");
    }
}

async function createNewSheet() {
    const name = prompt("Name für das neue Kunden-Sheet:");
    if (!name || name.trim() === "") return;

    try {
        const url = `${API_URL}?t=${new Date().getTime()}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: name.trim() })
        });
        const newSheet = await response.json();

        // Füge es oben in der Liste ein und wähle es aus
        state.sheets.unshift(newSheet);
        state.currentSheetId = newSheet.id;
        renderApp();
    } catch (error) {
        console.error("Fehler beim Erstellen:", error);
        alert("Fehler beim Erstellen des Sheets.");
    }
}

async function saveCurrentSheetData() {
    if (!state.currentSheetId) return;

    const currentSheet = state.sheets.find(s => s.id == state.currentSheetId);

    try {
        const url = `${API_URL}?id=${state.currentSheetId}&t=${new Date().getTime()}`;
        await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ data: currentSheet.data })
        });
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
    }
}

async function deleteCurrentSheet() {
    if (!state.currentSheetId) return;

    const currentSheet = state.sheets.find(s => s.id == state.currentSheetId);
    if (!confirm(`Möchtest du das Sheet "${currentSheet.name}" wirklich komplett löschen?`)) return;

    try {
        const url = `${API_URL}?id=${state.currentSheetId}&t=${new Date().getTime()}`;
        await fetch(url, {
            method: 'DELETE',
            credentials: 'include'
        });

        // Nach dem Löschen alles neu laden
        state.currentSheetId = null;
        await loadSheets();
    } catch (error) {
        console.error("Fehler beim Löschen:", error);
    }
}

/**
 * Event Listener einrichten
 */
function setupEventListeners() {
    themeToggleBtn.addEventListener('click', toggleTheme);
    addPartForm.addEventListener('submit', handleAddPart);
    newSheetBtn.addEventListener('click', createNewSheet);
    deleteSheetBtn.addEventListener('click', deleteCurrentSheet);

    // Modal Events (Phase 3)
    customerSummaryBtn.addEventListener('click', openCustomerSummary);
    closeModalBtn.addEventListener('click', closeCustomerSummary);
    copyWhatsAppBtn.addEventListener('click', copyForWhatsApp);

    // Invoice Events
    openInvoiceModalBtn.addEventListener('click', () => {
        closeCustomerSummary();
        invoiceModal.style.display = 'flex';

        const today = new Date();
        document.getElementById('invDate').valueAsDate = today;

        // Rechnungsnummer & Kundennummer im UI sperren und markieren
        document.getElementById('invInvoiceNumber').value = 'Wird generiert...';
        document.getElementById('invInvoiceNumber').disabled = true;

        const currentSheet = state.sheets.find(s => s.id == state.currentSheetId);
        if (currentSheet && currentSheet.customer_number) {
            document.getElementById('invCustomerNumber').value = currentSheet.customer_number;
        } else {
            document.getElementById('invCustomerNumber').value = 'Wird generiert...';
        }
        document.getElementById('invCustomerNumber').disabled = true;
    });

    closeInvoiceModalBtn.addEventListener('click', () => {
        invoiceModal.style.display = 'none';
    });

    invoiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentSheet = state.sheets.find(s => s.id == state.currentSheetId);
        if (!currentSheet) return;

        // Beträge für das Backend berechnen
        let totalUVP = 0;
        currentSheet.data.forEach(part => {
            totalUVP += part.uvp;
        });

        const discountVal = parseInt(document.getElementById('customerDiscount').value) || 0;
        let finalBrutto = totalUVP;
        if (discountVal > 0) {
            const discountAmount = totalUVP * (discountVal / 100);
            finalBrutto = totalUVP - discountAmount;
        }

        const finalNetto = finalBrutto / 1.2;
        const finalUst = finalBrutto - finalNetto;

        const payload = {
            sheet_id: currentSheet.id,
            customer_name: document.getElementById('invCustomerName').value,
            street: document.getElementById('invStreet').value,
            zip_city: document.getElementById('invZip').value + ' ' + document.getElementById('invCity').value,
            uid: document.getElementById('invUID').value,
            discount_percent: discountVal,
            total_net: finalNetto,
            total_tax: finalUst,
            total_gross: finalBrutto
        };

        try {
            const url = `${API_URL}?action=save_invoice&t=${new Date().getTime()}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Fehler beim Speichern im Backend.');
            }

            const data = await response.json();
            
            // Rechnungsnummer und Kundennummer vom Server in die Inputs übernehmen
            // (Damit generatePDF() sie direkt dort auslesen kann)
            document.getElementById('invInvoiceNumber').value = data.invoice_number;
            document.getElementById('invCustomerNumber').value = data.customer_number;
            
            // Kundennummer lokal im State aktualisieren
            currentSheet.customer_number = data.customer_number;

            // ERST JETZT generieren wir das PDF mit den echten Server-Daten!
            generatePDF();
            
            // Modal schließen
            invoiceModal.style.display = 'none';

        } catch (error) {
            console.error("Fehler beim Speichern der Rechnung:", error);
            alert("Es gab ein Problem beim Generieren der Rechnungsnummer. Bitte Server-Verbindung prüfen.");
        }
    });

    customerReadyCheck.addEventListener('change', (e) => {
        if (e.target.checked) {
            customerActionDetails.style.display = 'block';
        } else {
            customerActionDetails.style.display = 'none';
        }
    });

    sheetSelect.addEventListener('change', (e) => {
        state.currentSheetId = parseInt(e.target.value);
        renderApp();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = loginPasswordInput.value;
        try {
            const url = `${API_URL}?action=login&t=${new Date().getTime()}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password })
            });
            if (response.ok) {
                loginError.style.display = 'none';
                loginPasswordInput.value = '';
                await loadSheets();
            } else {
                loginError.style.display = 'block';
            }
        } catch (err) {
            console.error("Login Fehler:", err);
        }
    });
}

/**
 * Neues Teil hinzufügen
 */
function handleAddPart(event) {
    event.preventDefault();

    if (!state.currentSheetId) {
        alert("Bitte erstelle oder wähle zuerst ein Kunden-Sheet aus!");
        return;
    }

    const name = partNameInput.value.trim();
    const evValue = partEVInput.value.replace(',', '.');
    const uvpValue = partUVPInput.value.replace(',', '.');

    const ev = parseFloat(evValue);
    const uvp = parseFloat(uvpValue);

    if (name && !isNaN(ev) && !isNaN(uvp)) {
        const newPart = {
            id: Date.now(),
            name: name,
            ev: ev,
            uvp: uvp
        };

        // Teil zum lokalen State hinzufügen
        const sheetIndex = state.sheets.findIndex(s => s.id == state.currentSheetId);
        state.sheets[sheetIndex].data.push(newPart);

        // Formular zurücksetzen
        addPartForm.reset();
        partNameInput.focus();

        // UI aktualisieren und Daten im Hintergrund an die API senden
        renderApp();
        saveCurrentSheetData();
    }
}

/**
 * Teil löschen (wird über inline onclick im HTML aufgerufen)
 */
window.deletePart = function (partId) {
    if (!state.currentSheetId) return;

    const sheetIndex = state.sheets.findIndex(s => s.id == state.currentSheetId);
    state.sheets[sheetIndex].data = state.sheets[sheetIndex].data.filter(part => part.id !== partId);

    renderApp();
    saveCurrentSheetData(); // Update an API senden
};

/**
 * UI Rendering und Berechnungen
 */
function renderApp() {
    renderSheetSelect();

    // Checkbox & Felder zurücksetzen beim Laden / Wechseln
    customerReadyCheck.checked = false;
    customerActionDetails.style.display = 'none';
    customerDiscountInput.value = '';

    if (!state.currentSheetId) {
        currentSheetNameElement.textContent = "Kein Sheet";
        partsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem 0;">Bitte ein Sheet erstellen oder auswählen.</p>';
        updateSummary(0, 0);
        return;
    }

    const currentSheet = state.sheets.find(s => s.id == state.currentSheetId);
    if (currentSheet) {
        currentSheetNameElement.textContent = currentSheet.name;
        renderPartsList(currentSheet.data);
        calculateAndRenderSummary(currentSheet.data);
    }
}

function renderSheetSelect() {
    sheetSelect.innerHTML = '';

    if (state.sheets.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "-- Keine Sheets vorhanden --";
        sheetSelect.appendChild(option);
        sheetSelect.disabled = true;
        addPartForm.querySelector('button').disabled = true;
        deleteSheetBtn.disabled = true;
        return;
    }

    sheetSelect.disabled = false;
    addPartForm.querySelector('button').disabled = false;
    deleteSheetBtn.disabled = false;

    state.sheets.forEach(sheet => {
        const option = document.createElement('option');
        option.value = sheet.id;
        const dateStr = new Date(sheet.created_at).toLocaleDateString('de-DE');
        option.textContent = `${sheet.name} (${dateStr})`;
        if (sheet.id == state.currentSheetId) {
            option.selected = true;
        }
        sheetSelect.appendChild(option);
    });
}

function renderPartsList(parts) {
    partsContainer.innerHTML = '';

    if (parts.length === 0) {
        partsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem 0;">Keine Teile im Sheet.</p>';
        return;
    }

    parts.forEach((part, index) => {
        const partEl = document.createElement('div');
        partEl.className = 'part-item';
        partEl.innerHTML = `
            <div class="part-info">
                <div class="part-name">${index + 1}. ${part.name}</div>
                <div class="part-prices">EV: ${formatCurrency(part.ev)} | UVP: ${formatCurrency(part.uvp)}</div>
            </div>
            <button class="delete-part-btn" onclick="deletePart(${part.id})" aria-label="Teil löschen" title="Löschen">❌</button>
        `;
        partsContainer.appendChild(partEl);
    });
}

function calculateAndRenderSummary(parts) {
    let totalEV = 0;
    let totalUVP = 0;

    parts.forEach(part => {
        totalEV += part.ev;
        totalUVP += part.uvp;
    });

    updateSummary(totalEV, totalUVP);
}

function updateSummary(totalEV, totalUVP) {
    const profit = totalUVP - totalEV;
    const marginPercent = totalEV > 0 ? (profit / totalEV) * 100 : 0;

    totalEVElement.textContent = formatCurrency(totalEV);
    totalUVPElement.textContent = formatCurrency(totalUVP);

    const sign = profit > 0 ? '+ ' : (profit < 0 ? '- ' : '');
    totalProfitElement.textContent = `${sign}${formatCurrency(Math.abs(profit))}`;

    const profitRow = totalProfitElement.parentElement;
    const marginRow = profitMarginElement.parentElement;

    if (profit < 0) {
        profitRow.classList.add('negative');
        marginRow.classList.add('negative');
    } else {
        profitRow.classList.remove('negative');
        marginRow.classList.remove('negative');
    }

    profitMarginElement.textContent = `${sign}${marginPercent.toFixed(1)} %`;
}

/**
 * Hilfsfunktion zur Währungsformatierung
 */
function formatCurrency(value) {
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

/**
 * Phase 3: Kunden-Zusammenfassung & WhatsApp-Export
 */
function openCustomerSummary() {
    if (!state.currentSheetId) return;
    const currentSheet = state.sheets.find(s => s.id == state.currentSheetId);

    if (!currentSheet || currentSheet.data.length === 0) {
        alert("Das Sheet enthält noch keine Teile!");
        return;
    }

    const discountVal = parseInt(customerDiscountInput.value) || 0;
    let totalUVP = 0;

    // 1. Liste füllen (NUR UVP, KEIN EV!)
    modalPartsList.innerHTML = '';
    currentSheet.data.forEach((part, index) => {
        totalUVP += part.uvp;
        const partEl = document.createElement('div');
        partEl.className = 'part-item';
        partEl.innerHTML = `
            <div class="part-info">
                <div class="part-name">${index + 1}. ${part.name}</div>
                <div class="part-prices">Preis: ${formatCurrency(part.uvp)}</div>
            </div>
        `;
        modalPartsList.appendChild(partEl);
    });

    // 2. Rabatt-Logik ("für die Show") anwenden
    if (discountVal > 0) {
        const discountedTotal = totalUVP * (1 - (discountVal / 100));

        // Originalpreis in rot durchgestrichen
        modalOriginalTotal.textContent = formatCurrency(totalUVP);
        modalOriginalTotal.style.display = 'block';

        // Neuer Preis in grün
        modalFinalTotal.textContent = formatCurrency(discountedTotal);

        // Rabatt-Badge anzeigen
        modalDiscountBadge.textContent = `Sie sparen ${discountVal}%`;
        modalDiscountBadge.style.display = 'inline-block';
    } else {
        // Normalpreis (kein Rabatt)
        modalOriginalTotal.style.display = 'none';
        modalDiscountBadge.style.display = 'none';
        modalFinalTotal.textContent = formatCurrency(totalUVP);
    }

    // 3. Modal einblenden
    summaryModal.style.display = 'flex';
}

function closeCustomerSummary() {
    summaryModal.style.display = 'none';
}

function copyForWhatsApp() {
    if (!state.currentSheetId) return;
    const currentSheet = state.sheets.find(s => s.id == state.currentSheetId);
    if (!currentSheet) return;

    const discountVal = parseInt(customerDiscountInput.value) || 0;

    // WhatsApp Formatierung zusammenbauen
    let text = `*Angebot: ${currentSheet.name}*\n\n`;

    let totalUVP = 0;
    currentSheet.data.forEach((part, index) => {
        totalUVP += part.uvp;
        text += `${index + 1}. ${part.name} - ${formatCurrency(part.uvp)}\n`;
    });

    text += `\n`;

    if (discountVal > 0) {
        const discountedTotal = totalUVP * (1 - (discountVal / 100));
        // WhatsApp Syntax: ~Text~ für durchgestrichen, *Text* für fett
        text += `Originalpreis: ~${formatCurrency(totalUVP)}~\n`;
        text += `Dein Rabatt: ${discountVal}%\n`;
        text += `*Gesamtbetrag: ${formatCurrency(discountedTotal)}*`;
    } else {
        text += `*Gesamtbetrag: ${formatCurrency(totalUVP)}*`;
    }

    // In die Zwischenablage kopieren (Clipboard API)
    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyWhatsAppBtn.textContent;
        copyWhatsAppBtn.textContent = '✅ Erfolgreich kopiert!';
        setTimeout(() => {
            copyWhatsAppBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Fehler beim Kopieren: ', err);
        alert('Kopieren fehlgeschlagen. Möglicherweise blockiert der Browser die Zwischenablage.');
    });
}

/**
 * Phase 4: PDF Generierung (jsPDF)
 */
function generatePDF() {
    if (!state.currentSheetId) return;
    const currentSheet = state.sheets.find(s => s.id == state.currentSheetId);
    if (!currentSheet || currentSheet.data.length === 0) {
        alert("Fehler: Keine Teile im aktuellen Sheet vorhanden.");
        return;
    }

    if (typeof LOGO_BASE64 !== 'undefined') {
        const logoImg = new Image();
        logoImg.onload = function () {
            createPDFDocument(currentSheet, logoImg);
        };
        logoImg.onerror = function () {
            console.warn("Logo konnte nicht geladen werden.");
            createPDFDocument(currentSheet, null);
        };
        logoImg.src = LOGO_BASE64;
    } else {
        createPDFDocument(currentSheet, null);
    }
}

function createPDFDocument(currentSheet, logoImg) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Formulardaten auslesen
    const customerName = document.getElementById('invCustomerName').value;
    const street = document.getElementById('invStreet').value;
    const zip = document.getElementById('invZip').value;
    const city = document.getElementById('invCity').value;
    const uid = document.getElementById('invUID').value;
    const invoiceNumber = document.getElementById('invInvoiceNumber').value;
    const customerNumber = document.getElementById('invCustomerNumber').value;
    const dateStr = document.getElementById('invDate').value;
    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString('de-DE');
    const subject = document.getElementById('invSubject').value;
    const discountVal = parseInt(document.getElementById('customerDiscount').value) || 0;

    // Y=45: Header Links (ATB Information)
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("ATB AUTOTEILE HOHENEMS | Mondscheingasse 4 6845 Hohenems | UID-Nummer: ATU83182468 | Gerichtsstandort: Feldkirch", 14, 45);

    // Y=55 bis 72: Kundenadresse
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(customerName, 14, 55);
    doc.text(street, 14, 61);
    doc.text(`${zip} ${city}`, 14, 67);
    if (uid) {
        doc.text(`UID: ${uid}`, 14, 72);
    }

    // Logo Rechts Oben
    if (logoImg) {
        const targetWidth = 35;
        const targetHeight = targetWidth * (logoImg.height / logoImg.width);
        const xPos = 155; // X = 155, Y = 5
        doc.addImage(logoImg, 'PNG', xPos, 5, targetWidth, targetHeight);
    }

    // Y=60 (Rechts): Titel "Rechnung" in Akzent-Rot
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 0, 0);
    doc.text("Rechnung", 140, 60);

    // Y=85: Meta-Zeile
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    // Titel (fett)
    doc.setFont("helvetica", "bold");
    doc.text("Betreff", 14, 85);
    doc.text("Rechnungsnummer", 80, 85);
    doc.text("Kundennummer", 130, 85);
    doc.text("Datum", 170, 85);

    // Werte (normal)
    doc.setFont("helvetica", "normal");
    doc.text(subject, 14, 92);
    doc.text(invoiceNumber, 80, 92);
    doc.text(customerNumber, 130, 92);
    doc.text(formattedDate, 170, 92);

    // Tabellen-Daten berechnen
    const tableBody = [];
    let totalUVP = 0; // Brutto-Zwischensumme

    currentSheet.data.forEach((part, index) => {
        let uvp = part.uvp; // Das ist der Brutto-Preis

        const partNetto = uvp / 1.2;

        totalUVP += uvp;

        tableBody.push([
            index + 1,
            part.name,
            "1",
            formatCurrency(partNetto),
            "20%",
            formatCurrency(partNetto)
        ]);
    });

    let discountAmount = 0;
    let finalBrutto = totalUVP;

    if (discountVal > 0) {
        discountAmount = totalUVP * (discountVal / 100);
        finalBrutto = totalUVP - discountAmount;
    }

    const finalNetto = finalBrutto / 1.2;
    const finalUst = finalBrutto - finalNetto;

    // Y=105: Tabelle zeichnen mit jspdf-autotable
    doc.autoTable({
        startY: 105,
        head: [['Pos.', 'Beschreibung', 'Menge', 'Einzelpreis', 'USt.', 'Gesamtpreis (netto)']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
        styles: { font: "helvetica", fontSize: 10, textColor: [50, 50, 50] },
        columnStyles: {
            0: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'center' },
            5: { halign: 'right' }
        }
    });

    // Summenblock
    const finalY = doc.lastAutoTable.finalY + 10;

    // Rote Trennlinie
    doc.setDrawColor(200, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, finalY, 196, finalY);

    // Summen: Links USt., Rechts Brutto
    let currentY = finalY + 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    // Zwischensumme (netto)
    const initialNetto = totalUVP / 1.2;
    doc.text("Zwischensumme (netto):", 14, currentY);
    doc.text(formatCurrency(initialNetto), 55, currentY);
    currentY += 6;

    if (discountVal > 0) {
        const discountAmountNetto = discountAmount / 1.2;
        doc.text(`Rabatt (${discountVal}%):`, 14, currentY);
        doc.text(`- ${formatCurrency(discountAmountNetto)}`, 55, currentY);
        currentY += 6;
    }

    doc.text("Umsatzsteuer (20%):", 14, currentY);
    doc.text(formatCurrency(finalUst), 55, currentY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 0, 0); // Akzent-Rot für Endbetrag
    doc.text("Gesamtpreis (brutto):", 130, currentY);
    doc.text(formatCurrency(finalBrutto), 190, currentY, { align: 'right' });

    // Y=245: Footer (Lieferbedingungen, Bank)
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    doc.text("Lieferbedingung: ab Werk", 14, 245);
    doc.text("Zahlungsbedingung: innerhalb 14Tagen ab Rechnungsdatum", 14, 250);

    // Bankdaten
    doc.setFont("helvetica", "bold");
    doc.text("Bitte überweisen Sie den Betrag auf folgendes Konto:", 14, 260);
    doc.setFont("helvetica", "normal");
    doc.text("Dornbirner Sparkasse - IBAN: AT11 2060 4031 0391 2238 - BIC/SWIFT: SPFKAT2BXXX", 14, 265);

    // Abschluss-Satz
    doc.setFont("helvetica", "italic");
    doc.text("Wir danken für ihr Vertrauen und wünschen Ihnen weiterhin eine gute Fahrt!", 14, 275);

    // Ganz unten (Y=285): Hellgrauer 3-Spalten-Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);

    // Spalte 1: Adresse
    doc.text("ATB AUTOTEILE HOHENEMS", 14, 285);
    doc.text("Mondscheingasse 4, 6845 Hohenems", 14, 289);

    // Spalte 2: Kontakt
    doc.text("Telefon: +43 676 711 83 53", 85, 285);
    doc.text("E-Mail: info@atb-autoteile.at", 85, 289);

    // Spalte 3: Konto / Rechtliches
    doc.text("UID: ATU83182468", 150, 285);
    doc.text("Gerichtsstand: Feldkirch", 150, 289);

    // --- SEITE 2: EPC QR-CODE ---
    doc.addPage();
    
    // EPC String nach Vorgabe bauen
    // Betrag muss mit Punkt formatiert sein
    const amountEPC = finalBrutto.toFixed(2); 
    const epcString = `BCD\n002\n1\nSCT\nSPFKAT2BXXX\nMihai Oprea\nAT112060403103912238\nEUR${amountEPC}\n\n${invoiceNumber}\n\n`;

    // QR-Code generieren
    const qr = new QRious({
        value: epcString,
        size: 200,
        level: 'M'
    });
    const qrDataURL = qr.toDataURL('image/png');

    // Layout Seite 2
    // 1. Einleitungstext (Oben)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Vielen Dank für Ihren Auftrag!", 105, 40, { align: "center" });

    // 2. Trennlinie (Optische Abtrennung)
    doc.setLineWidth(0.5);
    doc.setLineDash([1, 1], 0);
    doc.line(14, 110, 196, 110);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("✂ Hier abtrennen", 196, 108, { align: "right" });
    doc.setLineDash([]); // Reset
    
    // 3. Zahlschein-Box (Unten)
    doc.setFillColor(250, 250, 250);
    doc.rect(14, 120, 182, 90, 'F');
    
    // 4. Zweispaltiges Layout im Zahlschein
    // Linke Spalte: QR-Code
    doc.addImage(qrDataURL, 'PNG', 25, 130, 70, 70);
    
    // Rechte Spalte: Zahlungsdetails
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Zahlungsdetails", 110, 135);
    
    doc.setFont("helvetica", "normal");
    doc.text("Empfänger: ATB Autoteile", 110, 145);
    doc.text("IBAN: AT11 2060 4031 0391 2238", 110, 155);
    doc.text("BIC: SPFKAT2BXXX", 110, 165);
    
    doc.setFont("helvetica", "bold");
    doc.text("Betrag: " + formatCurrency(finalBrutto), 110, 175);
    
    doc.setFont("helvetica", "normal");
    doc.text("Verwendungszweck: " + invoiceNumber, 110, 185);

    // PDF Speichern
    const filename = `Rechnung_${invoiceNumber}.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    doc.save(filename);

    // --- PHASE 3: PDF Upload ans Backend ---
    const pdfBase64 = doc.output('datauristring');
    const uploadPayload = {
        invoice_number: invoiceNumber,
        pdf_base64: pdfBase64
    };

    fetch(`${API_URL}?action=upload_pdf&t=${new Date().getTime()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(uploadPayload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            console.error("Upload-Fehler:", data.error);
        } else {
            console.log("PDF erfolgreich archiviert:", data.file_path);
        }
    })
    .catch(err => console.error("Netzwerkfehler beim PDF-Upload:", err));
}

// App starten sobald DOM geladen ist
document.addEventListener('DOMContentLoaded', init);
