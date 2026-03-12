/**
 * Shared invoice drawing utility for Darkroom admin pages.
 * Exposes window.darkroomDrawInvoice(order, items) → Promise<dataURL>
 *
 * order shape: { order_ref, created_at, customer_name, customer_phone,
 *               contact_method, customer_email, total_price_cents }
 * items shape: [{ service_name, service_group, quantity, line_total_cents }]
 */
(function () {
  async function darkroomDrawInvoice(order, items) {
    const BLACK = "#000000";
    const CREAM = "#EEE4D2";
    const RED   = "#ED1C24";
    const MUTED_DARK  = "rgba(0,0,0,0.38)";
    const MUTED_LIGHT = "rgba(238,228,210,0.45)";

    const W           = 680;
    const PAD         = 40;
    const HEADER_H    = 88;
    const STRIP_H     = 5;
    const INFO_H      = 128;
    const COL_LABEL_H = 40;
    const ROW_H       = 52;
    const TABLE_PAD_TOP = 28;
    const TOTAL_H     = 64;
    const CONTACT_H   = 52;
    const FOOTER_H    = 72;

    const H = HEADER_H + STRIP_H + INFO_H
            + TABLE_PAD_TOP + COL_LABEL_H + items.length * ROW_H
            + TOTAL_H + CONTACT_H + FOOTER_H;

    const SCALE = 2; // 2× resolution for crisp output
    const canvas = document.createElement("canvas");
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);

    await Promise.all([
      document.fonts.load("400 16px 'League Gothic'"),
      document.fonts.load("400 16px 'JetBrains Mono'"),
    ]).catch(() => null);

    const logoImg = new Image();
    await new Promise((res) => {
      logoImg.onload = res;
      logoImg.onerror = res;
      logoImg.src = "/images/logos/logo-light.png";
    });

    function mvr(cents) {
      return (Number(cents || 0) / 100)
        .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function hline(y, alpha) {
      alpha = alpha || 0.12;
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0," + alpha + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
      ctx.restore();
    }

    // Cream base
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);

    // 1. BLACK HEADER
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, W, HEADER_H);

    if (logoImg.naturalWidth > 0) {
      var lh = 32;
      var lw = logoImg.naturalWidth * (lh / logoImg.naturalHeight);
      ctx.drawImage(logoImg, PAD, (HEADER_H - lh) / 2, lw, lh);
    }

    ctx.fillStyle = CREAM;
    ctx.font = "400 40px 'League Gothic', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("INVOICE", W - PAD, HEADER_H / 2 + 8);

    ctx.font = "400 10px 'JetBrains Mono', monospace";
    ctx.fillStyle = MUTED_LIGHT;
    var dateStr = order.created_at
      ? new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    ctx.fillText((order.order_ref || "") + "  ·  " + dateStr, W - PAD, HEADER_H / 2 + 26);

    // 2. RED STRIP
    ctx.fillStyle = RED;
    ctx.fillRect(0, HEADER_H, W, STRIP_H);

    // 3. INFO GRID
    var infoTop = HEADER_H + STRIP_H + 28;
    var col2X   = W / 2 + 8;

    function drawInfoBlock(x, label, lines) {
      ctx.font = "400 9px 'JetBrains Mono', monospace";
      ctx.fillStyle = MUTED_DARK;
      ctx.textAlign = "left";
      ctx.fillText(label, x, infoTop);

      ctx.font = "700 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = BLACK;
      ctx.fillText(lines[0] || "", x, infoTop + 20);

      ctx.font = "400 12px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      for (var i = 1; i < lines.length; i++) {
        ctx.fillText(lines[i], x, infoTop + 20 + i * 18);
      }
    }

    var billedLines = [
      order.customer_name || "",
      order.customer_phone ? "+960 " + order.customer_phone : "",
      order.contact_method || "",
      order.customer_email || "",
    ].filter(Boolean);

    drawInfoBlock(PAD, "BILLED TO", billedLines);
    drawInfoBlock(col2X, "FROM", ["Darkroom", "hello@darkroom.mv", "+960 000-0000"]);

    var infoBottomY = HEADER_H + STRIP_H + INFO_H;
    hline(infoBottomY);

    // 4. TABLE
    var y = infoBottomY + TABLE_PAD_TOP;

    ctx.font = "400 9px 'JetBrains Mono', monospace";
    ctx.fillStyle = MUTED_DARK;
    ctx.textAlign = "left";
    ctx.fillText("SERVICE", PAD, y + 22);
    ctx.textAlign = "right";
    ctx.fillText("QTY", W - PAD - 90, y + 22);
    ctx.fillText("AMOUNT", W - PAD, y + 22);

    y += COL_LABEL_H;
    hline(y);

    for (var j = 0; j < items.length; j++) {
      var it    = items[j];
      var name  = String(it.service_name || it.name || "");
      var group = String(it.service_group || "");
      var qty   = String(it.quantity || it.qty || 0);
      var amt   = "MVR " + mvr(it.line_total_cents);

      ctx.font = "500 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = BLACK;
      ctx.textAlign = "left";
      ctx.fillText(name, PAD, y + 22);

      if (group) {
        ctx.font = "400 10px 'JetBrains Mono', monospace";
        ctx.fillStyle = MUTED_DARK;
        ctx.fillText(group.toUpperCase(), PAD, y + 36);
      }

      ctx.font = "400 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = BLACK;
      ctx.textAlign = "right";
      ctx.fillText(qty, W - PAD - 90, y + 22);
      ctx.fillText(amt, W - PAD, y + 22);

      y += ROW_H;
      hline(y, 0.07);
    }

    // 5. TOTAL BAND
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, y, W, TOTAL_H);

    ctx.font = "400 10px 'JetBrains Mono', monospace";
    ctx.fillStyle = MUTED_LIGHT;
    ctx.textAlign = "left";
    ctx.fillText("GRAND TOTAL", PAD, y + TOTAL_H / 2 + 4);

    ctx.font = "400 34px 'League Gothic', sans-serif";
    ctx.fillStyle = CREAM;
    ctx.textAlign = "right";
    ctx.fillText("MVR  " + mvr(order.total_price_cents), W - PAD, y + TOTAL_H / 2 + 12);

    y += TOTAL_H;

    // 6. CONTACT MESSAGE
    ctx.font = "400 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.textAlign = "left";
    ctx.fillText(
      "smolbo1 will contact you on " + (order.contact_method || "your preferred method") + " soon.",
      PAD, y + CONTACT_H / 2 + 4
    );

    y += CONTACT_H;
    hline(y, 0.08);

    // 7. FOOTER
    ctx.font = "400 9px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.textAlign = "left";
    ctx.fillText("hello@darkroom.mv  ·  +960 000-0000", PAD, y + 26);
    ctx.fillText("TELEGRAM  ·  VIBER  ·  WHATSAPP", PAD, y + 44);

    ctx.textAlign = "right";
    ctx.fillText("Thank you for choosing", W - PAD, y + 26);
    ctx.fillText("darkroom by smolbo1", W - PAD, y + 44);

    return canvas.toDataURL("image/png");
  }

  window.darkroomDrawInvoice = darkroomDrawInvoice;
})();
