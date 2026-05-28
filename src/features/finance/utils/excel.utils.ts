// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import * as XLSX from "xlsx";
import RNFetchBlob from "react-native-blob-util";
import Share from "react-native-share";
import { Platform } from "react-native";

/**
 * Utility to generate an Excel file from JSON data and trigger a share/download dialog.
 */
export const exportToExcel = async (data: any[], fileName: string) => {
  try {
    // 1. Create a new workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payouts");

    // 2. Generate base64 string of the Excel file
    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

    // 3. Define the path where the file will be saved temporarily
    const { dirs } = RNFetchBlob.fs;
    const path =
      Platform.OS === "ios"
        ? `${dirs.DocumentDir}/${fileName}.xlsx`
        : `${dirs.DownloadDir}/${fileName}.xlsx`;

    // 4. Save the file
    await RNFetchBlob.fs.writeFile(path, wbout, "base64");

    // 5. Share the file (this acts as a download/save prompt)
    await Share.open({
      title: "Export Payouts",
      url: Platform.OS === "ios" ? `file://${path}` : `file://${path}`,
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      failOnCancel: false,
    });

    return true;
  } catch (error) {
    console.error("[ExcelUtils] Export Error:", error);
    throw error;
  }
};
