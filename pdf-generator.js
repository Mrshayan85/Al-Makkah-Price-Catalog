/* ============================================
   PDF Generator — Interactive Catalog with pdf-lib
   ============================================ */

/**
 * Generates an interactive PDF catalog with editable form fields
 * and a WhatsApp submit button.
 *
 * Uses pdf-lib loaded from CDN (must be loaded before this script).
 */
async function generateCatalogPDF(shopData, products) {
  const { PDFDocument, StandardFonts, rgb, PDFName, PDFString, degrees, TextAlignment } = PDFLib;

  // ---- Constants ----
  const PAGE_WIDTH = 595.28; // A4
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
  const HEADER_HEIGHT = 95;
  const FOOTER_HEIGHT = 60;
  const TABLE_TOP_FIRST_PAGE = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT - 20;
  const TABLE_TOP_OTHER_PAGES = PAGE_HEIGHT - MARGIN - 20;
  const TABLE_BOTTOM = MARGIN + FOOTER_HEIGHT + 20;
  const ROW_HEIGHT = 28;
  const HEADER_ROW_HEIGHT = 32;

  // Colors
  const PRIMARY = rgb(99 / 255, 102 / 255, 241 / 255);       // #6366f1
  const PRIMARY_LIGHT = rgb(165 / 255, 180 / 255, 252 / 255); // #a5b4fc
  const DARK_TEXT = rgb(26 / 255, 26 / 255, 46 / 255);         // #1a1a2e
  const GRAY_TEXT = rgb(100 / 255, 116 / 255, 139 / 255);      // #64748b
  const LIGHT_BG = rgb(248 / 255, 250 / 255, 252 / 255);       // #f8fafc
  const WHITE = rgb(1, 1, 1);
  const WHATSAPP_GREEN = rgb(37 / 255, 211 / 255, 102 / 255);  // #25D366
  const WHATSAPP_DARK = rgb(18 / 255, 140 / 255, 126 / 255);   // #128C7E
  const ROW_ALT = rgb(243 / 255, 244 / 255, 246 / 255);        // #f3f4f6
  const BORDER_COLOR = rgb(226 / 255, 232 / 255, 240 / 255);   // #e2e8f0

  // ---- Create Document ----
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${shopData.shopName} - Product Catalog`);
  pdfDoc.setAuthor(shopData.shopName);
  pdfDoc.setSubject('Product Catalog & Order Form');
  pdfDoc.setCreator('PDF Catalog Generator - Developed by Shayan');

  // Embed fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const form = pdfDoc.getForm();

  // ---- Column Widths ----
  const COL_NUM = 35;
  const COL_NAME = 175;
  const COL_WHOLESALE = 80;
  const COL_RETAIL = 80;
  const COL_UNIT = 45;
  const COL_QTY = CONTENT_WIDTH - COL_NUM - COL_NAME - COL_WHOLESALE - COL_RETAIL - COL_UNIT; // ~100.28

  // ---- Helper: Draw Header ----
  function drawHeader(page) {
    const y = PAGE_HEIGHT - MARGIN;

    // Header background
    page.drawRectangle({
      x: MARGIN,
      y: y - HEADER_HEIGHT,
      width: CONTENT_WIDTH,
      height: HEADER_HEIGHT,
      color: PRIMARY,
      borderColor: PRIMARY,
      borderWidth: 0,
    });

    // Decorative accent line
    page.drawRectangle({
      x: MARGIN,
      y: y - HEADER_HEIGHT,
      width: CONTENT_WIDTH,
      height: 3,
      color: PRIMARY_LIGHT,
    });

    // Shop Name
    const shopNameText = shopData.shopName || 'My Shop';
    const nameWidth = fontBold.widthOfTextAtSize(shopNameText, 22);
    page.drawText(shopNameText, {
      x: MARGIN + (CONTENT_WIDTH - nameWidth) / 2,
      y: y - 38,
      size: 22,
      font: fontBold,
      color: WHITE,
    });

    // Subtitle
    const subtitle = 'Product Catalog & Order Form';
    const subWidth = fontRegular.widthOfTextAtSize(subtitle, 11);
    page.drawText(subtitle, {
      x: MARGIN + (CONTENT_WIDTH - subWidth) / 2,
      y: y - 58,
      size: 11,
      font: fontRegular,
      color: PRIMARY_LIGHT,
    });

    // Contact line
    const contactLine = `Tel: ${shopData.phone}  |  Email: ${shopData.email}`;
    const contactWidth = fontRegular.widthOfTextAtSize(contactLine, 8);
    page.drawText(contactLine, {
      x: MARGIN + (CONTENT_WIDTH - contactWidth) / 2,
      y: y - 78,
      size: 8,
      font: fontRegular,
      color: rgb(200 / 255, 210 / 255, 255 / 255),
    });
  }

  const ADMIN_CONTACT_NUMBER = "+92 3082135452"; // Hardcoded admin contact for PDF creation/orders

  // ---- Helper: Draw Footer ----
  function drawFooter(page, pageNum, totalPages) {
    const y = MARGIN;

    // Separator line
    page.drawLine({
      start: { x: MARGIN, y: y + FOOTER_HEIGHT },
      end: { x: PAGE_WIDTH - MARGIN, y: y + FOOTER_HEIGHT },
      thickness: 1,
      color: BORDER_COLOR,
    });

    // Address
    const addressText = `Address: ${shopData.address}`;
    page.drawText(addressText, {
      x: MARGIN,
      y: y + FOOTER_HEIGHT - 14,
      size: 7.5,
      font: fontRegular,
      color: GRAY_TEXT,
    });

    // Contact
    const contactText = `Phone: ${shopData.phone}  |  WhatsApp: ${shopData.whatsappNumber}`;
    page.drawText(contactText, {
      x: MARGIN,
      y: y + FOOTER_HEIGHT - 25,
      size: 7.5,
      font: fontRegular,
      color: GRAY_TEXT,
    });

    // Admin Phone line (for PDF creation or placing order)
    const adminLine = `To create a PDF or place an order, please contact Admin at: ${ADMIN_CONTACT_NUMBER}`;
    page.drawText(adminLine, {
      x: MARGIN,
      y: y + FOOTER_HEIGHT - 36,
      size: 7,
      font: fontRegular,
      color: GRAY_TEXT,
    });

    // Developed by Shayan
    const devText = `Developed by ${shopData.developerName || 'Shayan'}`;
    page.drawText(devText, {
      x: MARGIN,
      y: y + FOOTER_HEIGHT - 47,
      size: 7,
      font: fontItalic,
      color: PRIMARY,
    });

    // Page number
    const pageText = `Page ${pageNum} of ${totalPages}`;
    const pageTextWidth = fontRegular.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, {
      x: PAGE_WIDTH - MARGIN - pageTextWidth,
      y: y + FOOTER_HEIGHT - 14,
      size: 8,
      font: fontRegular,
      color: GRAY_TEXT,
    });
  }

  // ---- Helper: Draw Table Header ----
  function drawTableHeader(page, y) {
    // Header background
    page.drawRectangle({
      x: MARGIN,
      y: y - HEADER_ROW_HEIGHT,
      width: CONTENT_WIDTH,
      height: HEADER_ROW_HEIGHT,
      color: PRIMARY,
    });

    let xPos = MARGIN;
    const headers = [
      { text: '#', width: COL_NUM },
      { text: 'Product Name', width: COL_NAME },
      { text: `Wholesale (${shopData.currency})`, width: COL_WHOLESALE },
      { text: `Retail (${shopData.currency})`, width: COL_RETAIL },
      { text: 'Unit', width: COL_UNIT },
      { text: 'Qty', width: COL_QTY },
    ];

    headers.forEach((header) => {
      page.drawText(header.text, {
        x: xPos + 8,
        y: y - HEADER_ROW_HEIGHT + 10,
        size: 8.5,
        font: fontBold,
        color: WHITE,
      });
      xPos += header.width;
    });

    return y - HEADER_ROW_HEIGHT;
  }

  // ---- Calculate Pagination ----
  const rowsFirstPage = Math.floor((TABLE_TOP_FIRST_PAGE - TABLE_BOTTOM - HEADER_ROW_HEIGHT) / ROW_HEIGHT);
  const rowsPerPage = Math.floor((TABLE_TOP_OTHER_PAGES - TABLE_BOTTOM - HEADER_ROW_HEIGHT) / ROW_HEIGHT);

  let totalPages = 1;
  let remaining = products.length - rowsFirstPage;
  if (remaining > 0) {
    totalPages += Math.ceil(remaining / rowsPerPage);
  }

  // Also need a page for WhatsApp button and notes if products fill last page
  const lastPageProducts = products.length <= rowsFirstPage
    ? products.length
    : ((products.length - rowsFirstPage) % rowsPerPage) || rowsPerPage;

  const lastPageTableTop = totalPages === 1 ? TABLE_TOP_FIRST_PAGE : TABLE_TOP_OTHER_PAGES;
  const lastPageBottomY = lastPageTableTop - HEADER_ROW_HEIGHT - (lastPageProducts * ROW_HEIGHT);
  const spaceForButton = lastPageBottomY - TABLE_BOTTOM;

  // If not enough space for the WhatsApp button & Notes box (need ~170px), add extra page
  const TOTAL_SPACE_NEEDED = 170;
  let buttonOnNewPage = spaceForButton < TOTAL_SPACE_NEEDED;
  if (buttonOnNewPage) {
    totalPages++;
  }

  // ---- Draw Pages ----
  let productIndex = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: WHITE,
    });

    const isFirstPage = pageNum === 1;
    const isLastPage = pageNum === totalPages;
    const isButtonPage = isLastPage;

    // Header (only on first page)
    if (isFirstPage) {
      drawHeader(page);
    } else {
      // Mini header on subsequent pages
      const miniTitle = shopData.shopName + ' - Product Catalog';
      page.drawText(miniTitle, {
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN + 5,
        size: 10,
        font: fontBold,
        color: PRIMARY,
      });
      page.drawLine({
        start: { x: MARGIN, y: PAGE_HEIGHT - MARGIN },
        end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - MARGIN },
        thickness: 1,
        color: PRIMARY,
      });
    }

    // Footer on every page
    drawFooter(page, pageNum, totalPages);

    // Determine how many rows on this page
    const tableTop = isFirstPage ? TABLE_TOP_FIRST_PAGE : TABLE_TOP_OTHER_PAGES;
    const maxRows = isFirstPage ? rowsFirstPage : rowsPerPage;
    const rowsThisPage = Math.min(maxRows, products.length - productIndex);

    // Only draw table if there are products to show on this page
    if (rowsThisPage > 0 && productIndex < products.length) {
      // Table header
      let currentY = drawTableHeader(page, tableTop);

      // Table rows
      for (let r = 0; r < rowsThisPage && productIndex < products.length; r++) {
        const product = products[productIndex];
        const rowY = currentY - ROW_HEIGHT;
        const isEven = r % 2 === 0;

        // Row background (alternating)
        if (isEven) {
          page.drawRectangle({
            x: MARGIN,
            y: rowY,
            width: CONTENT_WIDTH,
            height: ROW_HEIGHT,
            color: ROW_ALT,
          });
        }

        // Row border bottom
        page.drawLine({
          start: { x: MARGIN, y: rowY },
          end: { x: PAGE_WIDTH - MARGIN, y: rowY },
          thickness: 0.5,
          color: BORDER_COLOR,
        });

        // Cell content
        let xPos = MARGIN;
        const textY = rowY + 9;

        // # Number
        page.drawText(String(productIndex + 1), {
          x: xPos + 12,
          y: textY,
          size: 8,
          font: fontRegular,
          color: GRAY_TEXT,
        });
        xPos += COL_NUM;

        // Product Name
        const displayName = product.name.length > 32
          ? product.name.substring(0, 30) + '...'
          : product.name;
        page.drawText(displayName, {
          x: xPos + 8,
          y: textY,
          size: 9,
          font: fontBold,
          color: DARK_TEXT,
        });
        xPos += COL_NAME;

        // Wholesale Price
        page.drawText(`${shopData.currency} ${product.wholesalePrice.toLocaleString()}`, {
          x: xPos + 8,
          y: textY,
          size: 8.5,
          font: fontRegular,
          color: DARK_TEXT,
        });
        xPos += COL_WHOLESALE;

        // Retail Price
        page.drawText(`${shopData.currency} ${product.retailPrice.toLocaleString()}`, {
          x: xPos + 8,
          y: textY,
          size: 8.5,
          font: fontBold,
          color: rgb(34 / 255, 197 / 255, 94 / 255),
        });
        xPos += COL_RETAIL;

        // Unit
        page.drawText(product.unit, {
          x: xPos + 8,
          y: textY,
          size: 8,
          font: fontRegular,
          color: GRAY_TEXT,
        });
        xPos += COL_UNIT;

        // Quantity field with Plus/Minus buttons (AcroForm)

        // 1. Minus Button
        const minusBtn = form.createButton(`minus_${productIndex}`);
        minusBtn.addToPage('-', page, {
          x: xPos + 4,
          y: rowY + 3,
          width: 26,
          height: ROW_HEIGHT - 6,
          borderWidth: 1,
          borderColor: PRIMARY,
          backgroundColor: rgb(241 / 255, 245 / 255, 249 / 255), // light slate background
          textColor: PRIMARY,
        });
        minusBtn.setFontSize(14);

        const minusJS = `
          try {
            var f = this.getField("qty_${productIndex}");
            var v = f.value;
            var n = v ? parseInt(v) : 0;
            if (isNaN(n)) n = 0;
            if (n > 1) {
              f.value = String(n - 1);
            } else {
              f.value = "";
            }
          } catch(e) {}
        `.trim();

        minusBtn.acroField.getWidgets().forEach((widget) => {
          widget.dict.set(
            PDFName.of('AA'),
            pdfDoc.context.obj({
              U: {
                Type: 'Action',
                S: 'JavaScript',
                JS: PDFString.of(minusJS),
              },
            })
          );
        });

        // 2. Qty Text Field (Centered)
        const qtyField = form.createTextField(`qty_${productIndex}`);
        qtyField.setText('');
        qtyField.setAlignment(TextAlignment.Center);
        qtyField.addToPage(page, {
          x: xPos + 34,
          y: rowY + 3,
          width: 32,
          height: ROW_HEIGHT - 6,
          borderWidth: 1,
          borderColor: PRIMARY,
          backgroundColor: WHITE,
        });
        qtyField.setFontSize(10);

        // 3. Plus Button
        const plusBtn = form.createButton(`plus_${productIndex}`);
        plusBtn.addToPage('+', page, {
          x: xPos + 70,
          y: rowY + 3,
          width: 26,
          height: ROW_HEIGHT - 6,
          borderWidth: 1,
          borderColor: PRIMARY,
          backgroundColor: rgb(241 / 255, 245 / 255, 249 / 255),
          textColor: PRIMARY,
        });
        plusBtn.setFontSize(14);

        const plusJS = `
          try {
            var f = this.getField("qty_${productIndex}");
            var v = f.value;
            var n = v ? parseInt(v) : 0;
            if (isNaN(n)) n = 0;
            f.value = String(n + 1);
          } catch(e) {}
        `.trim();

        plusBtn.acroField.getWidgets().forEach((widget) => {
          widget.dict.set(
            PDFName.of('AA'),
            pdfDoc.context.obj({
              U: {
                Type: 'Action',
                S: 'JavaScript',
                JS: PDFString.of(plusJS),
              },
            })
          );
        });

        // Left border for table
        page.drawLine({
          start: { x: MARGIN, y: currentY },
          end: { x: MARGIN, y: rowY },
          thickness: 0.5,
          color: BORDER_COLOR,
        });

        // Right border for table
        page.drawLine({
          start: { x: PAGE_WIDTH - MARGIN, y: currentY },
          end: { x: PAGE_WIDTH - MARGIN, y: rowY },
          thickness: 0.5,
          color: BORDER_COLOR,
        });

        currentY = rowY;
        productIndex++;
      }

      // Bottom border of table
      page.drawLine({
        start: { x: MARGIN, y: currentY },
        end: { x: PAGE_WIDTH - MARGIN, y: currentY },
        thickness: 1,
        color: PRIMARY,
      });
    }

    // ---- WhatsApp Button & Suggestion Box on Last Page ----
    if (isButtonPage) {
      // Calculate Y position for notes and button
      let notesY;
      if (buttonOnNewPage && productIndex >= products.length && rowsThisPage === 0) {
        // Notes and Button-only page
        notesY = PAGE_HEIGHT / 2 + 70;
      } else {
        const tableTop2 = isFirstPage ? TABLE_TOP_FIRST_PAGE : TABLE_TOP_OTHER_PAGES;
        const rowsDrawn = rowsThisPage > 0 ? rowsThisPage : 0;
        notesY = tableTop2 - HEADER_ROW_HEIGHT - (rowsDrawn * ROW_HEIGHT) - 30;
      }

      // Draw Notes Label
      const notesLabel = 'Special Instructions / Order Notes (Optional):';
      page.drawText(notesLabel, {
        x: MARGIN,
        y: notesY,
        size: 9,
        font: fontBold,
        color: DARK_TEXT,
      });

      // Create interactive notes text field (multiline)
      const notesFieldHeight = 50;
      const notesFieldY = notesY - notesFieldHeight - 6;

      const notesField = form.createTextField('orderNotes');
      notesField.setText('');
      notesField.enableMultiline();
      notesField.addToPage(page, {
        x: MARGIN,
        y: notesFieldY,
        width: CONTENT_WIDTH,
        height: notesFieldHeight,
        borderWidth: 1,
        borderColor: PRIMARY,
        backgroundColor: WHITE,
      });
      notesField.setFontSize(9);

      // position the instruction text below notes field
      const buttonY = notesFieldY - 40;

      // Instruction text
      const instructionText = 'Fill in the quantities above, then click the button below to send your order via WhatsApp:';
      const instructWidth = fontRegular.widthOfTextAtSize(instructionText, 9);
      page.drawText(instructionText, {
        x: MARGIN + (CONTENT_WIDTH - instructWidth) / 2,
        y: buttonY + 18,
        size: 9,
        font: fontRegular,
        color: GRAY_TEXT,
      });

      // WhatsApp button dimensions
      const btnWidth = 260;
      const btnHeight = 40;
      const btnX = MARGIN + (CONTENT_WIDTH - btnWidth) / 2;
      const btnY = buttonY - btnHeight + 8;

      // Draw background rectangle for WhatsApp Button (Mobile friendly)
      page.drawRectangle({
        x: btnX,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        color: WHATSAPP_GREEN,
        borderColor: WHATSAPP_DARK,
        borderWidth: 1,
      });

      // Draw text for WhatsApp Button
      const btnText = 'Send Order via WhatsApp';
      const btnTextWidth = fontBold.widthOfTextAtSize(btnText, 14);
      page.drawText(btnText, {
        x: btnX + (btnWidth - btnTextWidth) / 2,
        y: btnY + 14,
        size: 14,
        font: fontBold,
        color: WHITE,
      });

      // Create interactive transparent button overlay
      const whatsappBtn = form.createButton('sendWhatsApp');
      whatsappBtn.addToPage(' ', page, {
        x: btnX,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        borderWidth: 0,
      });

      // Build JavaScript for the button
      const productDataJS = products.map((p, i) => {
        const safeName = p.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
        return `{name:"${safeName}",price:"${shopData.currency} ${p.retailPrice}",idx:${i}}`;
      }).join(',');

      const whatsappJS = `
        try {
          var products = [${productDataJS}];
          var shopName = "${shopData.shopName.replace(/"/g, '\\"')}";
          var msg = "ORDER FROM: " + shopName + "\\n";
          msg += "================================\\n\\n";
          var hasOrder = false;
          var totalItems = 0;
          for (var i = 0; i < products.length; i++) {
            var qtyField = this.getField("qty_" + products[i].idx);
            var qty = qtyField ? qtyField.value : "";
            if (qty && qty !== "" && qty !== "0" && !isNaN(qty)) {
              var qtyNum = parseInt(qty);
              msg += "- " + products[i].name + " x " + qtyNum + " (" + products[i].price + " each)\\n";
              hasOrder = true;
              totalItems += qtyNum;
            }
          }
          if (hasOrder) {
            msg += "\\n================================\\n";
            msg += "Total Items: " + totalItems + "\\n";
            
            // Capture order notes/instructions
            var notesField = this.getField("orderNotes");
            var notes = notesField ? notesField.value : "";
            if (notes && notes.trim() !== "") {
              msg += "\\nNotes: " + notes.trim() + "\\n";
            }
            
            msg += "\\nPlease confirm availability and total amount. Thank you!";
            var encoded = encodeURIComponent(msg);
            var url = "https://wa.me/${shopData.whatsappNumber}?text=" + encoded;
            app.launchURL(url, true);
          } else {
            app.alert("Please enter quantity for at least one product before sending the order.", 3);
          }
        } catch(e) {
          app.alert("Error: " + e.message + "\\n\\nPlease make sure you are using Adobe Acrobat Reader to use this feature.", 0);
        }
      `.trim();

      // Inject JavaScript action into button
      whatsappBtn.acroField.getWidgets().forEach((widget) => {
        widget.dict.set(
          PDFName.of('AA'),
          pdfDoc.context.obj({
            U: {
              Type: 'Action',
              S: 'JavaScript',
              JS: PDFString.of(whatsappJS),
            },
          })
        );
      });

      // Note about Adobe Acrobat
      const noteText = 'Note: Please open this PDF in Adobe Acrobat Reader for the WhatsApp button to work.';
      const noteWidth = fontItalic.widthOfTextAtSize(noteText, 7);
      page.drawText(noteText, {
        x: MARGIN + (CONTENT_WIDTH - noteWidth) / 2,
        y: btnY - 20,
        size: 7,
        font: fontItalic,
        color: GRAY_TEXT,
      });
    }
  }

  // ---- Flatten non-qty fields / finalize ----
  // (We keep form fields interactive so users can fill them)

  // ---- Save and Download ----
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Trigger download of the generated PDF
 */
function downloadPDF(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'catalog.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
