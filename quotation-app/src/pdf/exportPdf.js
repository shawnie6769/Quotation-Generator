import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { todayISO } from '../components/clientForm.js';

export function initializePdfExport({ downloadBtn, statusMsg, sheet }) {
  function cloneWithCurrentValues(node) {
    const clone = node.cloneNode(true);
    const sourceFields = node.querySelectorAll('input, select, textarea');
    const cloneFields = clone.querySelectorAll('input, select, textarea');
    sourceFields.forEach((field, index) => {
      cloneFields[index].value = field.value;
    });
    return clone;
  }

  function createSection(content) {
    const section = document.createElement('div');
    section.className = 'sheet pdf-section printing';
    section.appendChild(content);
    return section;
  }

  function createBody(...children) {
    const body = document.createElement('div');
    body.className = 'sheet-body';
    children.forEach((child) => body.appendChild(child));
    return body;
  }

  function createHeaderSection() {
    const letterhead = cloneWithCurrentValues(sheet.querySelector('.letterhead'));
    const meta = cloneWithCurrentValues(sheet.querySelector('.meta-row'));
    meta.querySelectorAll('input').forEach((input) => {
      const value = document.createElement('span');
      value.className = 'pdf-field-value';
      value.textContent = input.value;
      input.replaceWith(value);
    });
    const content = document.createElement('div');
    content.appendChild(letterhead);
    content.appendChild(createBody(meta));
    return createSection(content);
  }

  function createItemsSection(rows) {
    const sourceTable = sheet.querySelector('table');
    const table = sourceTable.cloneNode(false);
    const header = cloneWithCurrentValues(sourceTable.querySelector('thead'));
    header.querySelectorAll('.column-name').forEach((input) => {
      const title = document.createElement('span');
      title.className = 'pdf-column-name';
      title.textContent = input.value;
      input.replaceWith(title);
    });
    table.appendChild(header);
    const body = document.createElement('tbody');
    rows.forEach((row) => {
      const clonedRow = cloneWithCurrentValues(row);
      const sourceDescription = row.querySelector('.desc-input');
      const description = document.createElement('div');
      description.className = 'pdf-description-value';
      description.textContent = sourceDescription.value;
      clonedRow.querySelector('.desc-input').replaceWith(description);

      const sourceUnit = row.querySelector('.unit-input');
      const sourceOtherUnit = row.querySelector('.other-unit-input');
      const unitLabel = document.createElement('span');
      unitLabel.className = 'pdf-unit-value';
      unitLabel.textContent = sourceUnit.value === 'other'
        ? sourceOtherUnit.value
        : sourceUnit.value === 'none' ? '' : sourceUnit.value;
      clonedRow.querySelector('.unit').replaceChildren(unitLabel);
      body.appendChild(clonedRow);
    });
    table.appendChild(body);
    return createSection(createBody(table));
  }

  function createFooterSection() {
    const sourceTerms = sheet.querySelector('.terms');
    const terms = cloneWithCurrentValues(sourceTerms);
    const textarea = terms.querySelector('textarea');
    const termsText = document.createElement('div');
    termsText.className = 'terms-print-value';
    termsText.textContent = sourceTerms.querySelector('textarea').value;
    textarea.replaceWith(termsText);
    const totals = cloneWithCurrentValues(sheet.querySelector('.totals'));
    const signature = cloneWithCurrentValues(sheet.querySelector('.signature'));
    return createSection(createBody(totals, terms, signature));
  }

  function createFullSection(rows) {
    const header = createHeaderSection();
    const items = createItemsSection(rows);
    const footer = createFooterSection();
    const content = document.createElement('div');
    const body = createBody(
      header.querySelector('.meta-row'),
      items.querySelector('table'),
      footer.querySelector('.totals'),
      footer.querySelector('.terms'),
      footer.querySelector('.signature')
    );
    content.appendChild(header.querySelector('.letterhead'));
    content.appendChild(body);
    return createSection(content);
  }

  async function renderSection(section) {
    document.body.appendChild(section);
    await Promise.all([...section.querySelectorAll('img')].map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        const finish = () => {
          clearTimeout(timeout);
          resolve();
        };
        image.addEventListener('load', finish, { once: true });
        image.addEventListener('error', finish, { once: true });
      });
    }));
    const canvas = await html2canvas(section, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    });
    section.remove();
    return canvas;
  }

  function measureSection(section) {
    document.body.appendChild(section);
    const bounds = section.getBoundingClientRect();
    const measured = { height: bounds.height, width: bounds.width };
    section.remove();
    return measured;
  }

  function addCanvasToPdf(pdf, canvas, cursorY, pageWidth, pageHeight) {
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    if (cursorY > 0 && cursorY + imgHeight > pageHeight) {
      pdf.addPage();
      cursorY = 0;
    }
    const scale = Math.min(1, pageHeight / imgHeight);
    const renderedWidth = pageWidth * scale;
    const renderedHeight = imgHeight * scale;
    const x = (pageWidth - renderedWidth) / 2;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', x, cursorY, renderedWidth, renderedHeight);
    return cursorY + renderedHeight;
  }

  function addFooterToPdf(pdf, canvas, cursorY, pageWidth, pageHeight) {
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    const scale = Math.min(1, pageHeight / imageHeight);
    const renderedWidth = pageWidth * scale;
    const renderedHeight = imageHeight * scale;
    if (cursorY + renderedHeight > pageHeight && cursorY > 0) {
      pdf.addPage();
    }

    const x = (pageWidth - renderedWidth) / 2;
    const y = pageHeight - renderedHeight;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', x, y, renderedWidth, renderedHeight);
  }

  async function downloadPdf() {
    downloadBtn.disabled = true;
    statusMsg.textContent = 'Preparing your PDF…';
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const headerCanvas = await renderSection(createHeaderSection());
      const footerCanvas = await renderSection(createFooterSection());
      const rows = [...sheet.querySelectorAll('#itemsBody tr')];
      const fullSection = createFullSection(rows);
      const fullSize = measureSection(fullSection);
      const fullHeight = (fullSize.height * pageWidth) / fullSize.width;

      if (fullHeight <= pageHeight) {
        addCanvasToPdf(pdf, await renderSection(fullSection), 0, pageWidth, pageHeight);
        const clientName = document.getElementById('clientName').value.trim() || 'Untitled';
        const date = document.getElementById('quoteDate').value || todayISO();
        const safeName = clientName.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
        pdf.save(`Quotation-${safeName}-${date}.pdf`);
        statusMsg.textContent = 'PDF downloaded.';
        return;
      }

      let cursorY = addCanvasToPdf(pdf, headerCanvas, 0, pageWidth, pageHeight);
      let rowIndex = 0;

      while (rowIndex < rows.length) {
        const pageRows = [];

        while (rowIndex < rows.length) {
          const candidateRows = [...pageRows, rows[rowIndex]];
          const candidate = measureSection(createItemsSection(candidateRows));
          const remainingHeight = (pageHeight - cursorY) * candidate.width / pageWidth;

          if (pageRows.length && candidate.height > remainingHeight) break;
          if (!pageRows.length && candidate.height > remainingHeight && cursorY > 0) {
            pdf.addPage();
            cursorY = 0;
            continue;
          }

          pageRows.push(rows[rowIndex]);
          rowIndex += 1;
        }

        if (pageRows.length) {
          cursorY = addCanvasToPdf(
            pdf,
            await renderSection(createItemsSection(pageRows)),
            cursorY,
            pageWidth,
            pageHeight
          );
        }

        if (rowIndex < rows.length) {
          pdf.addPage();
          cursorY = 0;
        }
      }

      addFooterToPdf(pdf, footerCanvas, cursorY, pageWidth, pageHeight);

      const clientName = document.getElementById('clientName').value.trim() || 'Untitled';
      const date = document.getElementById('quoteDate').value || todayISO();
      const safeName = clientName.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
      pdf.save(`Quotation-${safeName}-${date}.pdf`);
      statusMsg.textContent = 'PDF downloaded.';
    } catch (error) {
      console.error(error);
      statusMsg.textContent = 'Something went wrong generating the PDF. Please try again.';
    } finally {
      downloadBtn.disabled = false;
      setTimeout(() => { statusMsg.textContent = ''; }, 4000);
    }
  }

  downloadBtn.addEventListener('click', downloadPdf);
}
