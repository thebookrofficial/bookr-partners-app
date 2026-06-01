import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1?target=deno";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  // 1. Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { venueName, startDate, endDate, data } = await req.json();

    if (!data || !Array.isArray(data)) {
      throw new Error("Invalid data format. Expected an array of objects.");
    }

    // Create a new PDF document
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // --- Header Section ---
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("PAYOUT REPORT", 14, 20);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, 24, 283, 24); // A4 landscape width is ~297mm

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Venue: ${venueName}`, 14, 32);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 38);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 283, 32, { align: "right" });

    // Helper to format time to 12-hour format
    const formatTime12h = (timeStr: string) => {
      if (!timeStr || timeStr === "N/A" || typeof timeStr !== "string") return timeStr;
      try {
        const parts = timeStr.split(":");
        if (parts.length < 2) return timeStr;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const period = hours >= 12 ? "PM" : "AM";
        const h = hours % 12 || 12;
        return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
      } catch {
        return timeStr;
      }
    };

    // --- Table Section ---
    const headers = Object.keys(data[0] || {});

    // Filter out rows that are empty objects (spacing rows from the client)
    const tableBody = data
      .filter(row => Object.keys(row).length > 0)
      .map((row: any) =>
        headers.map(h => {
          const val = row[h];

          // Format Time columns
          if (h.includes("Time")) {
            return formatTime12h(val);
          }

          // Format Currency columns
          if (
            h.includes("Amount") ||
            h.includes("Commission") ||
            h.includes("Fee") ||
            h.includes("Payout")
          ) {
            return typeof val === "number" ? `₹${val.toFixed(2)}` : val;
          }
          return val;
        }),
      );

    autoTable(doc, {
      head: [headers],
      body: tableBody,
      startY: 45,
      theme: "grid",
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: "middle",
      },
      columnStyles: {
        // Alignment for currency columns if they exist
        5: { halign: "right" }, // Total Amount
        6: { halign: "right" }, // Paid Amount
        7: { halign: "right" }, // Bookr Commission
        8: { halign: "right" }, // Handling Fee
        9: { halign: "right" }, // Final Payout
      },
      didParseCell: cellData => {
        // Style the "TOTAL" row
        if (cellData.row.raw[0] === "TOTAL") {
          cellData.cell.styles.fontStyle = "bold";
          cellData.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" },
      );
      doc.text(
        "Bookr Business - Confidential Financial Document",
        14,
        doc.internal.pageSize.height - 10,
      );
    }

    const pdfOutput = doc.output("arraybuffer");

    return new Response(pdfOutput, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("[export-payout-pdf] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
