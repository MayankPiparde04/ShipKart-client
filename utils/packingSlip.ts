import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";

type CartonLike = {
  cartonDetails?: {
    id?: string;
    name?: string;
    cost?: number;
    volume?: number;
    length?: number;
    breadth?: number;
    height?: number;
  };
  length?: number;
  breadth?: number;
  height?: number;
  cartonId?: string;
  cartonName?: string;
  itemsPacked?: number;
  orientation?: string | null;
  orientationDetails?: {
    dimensionsUsed?: {
      length?: number;
      breadth?: number;
      height?: number;
    };
  };
  packingMetrics?: {
    wasteSpace?: number;
  };
  layout?: {
    packedItems?: {
      dimensions?: {
        length?: number;
        breadth?: number;
        height?: number;
      };
    }[];
  };
  cost?: {
    total?: number;
  };
};

type PackingSlipInput = {
  generatedAt?: Date;
  productName?: string;
  productDimensions?: string;
  isFragile?: boolean;
  preferredOrientation?: string | null;
  packedQty?: number;
  cartons: CartonLike[];
  productWeightGrams?: number;
  shippingRatePerKg?: number;
  fragileHandlingFee?: number;
  cartonBaseCost?: number;
  logoDataUri?: string;
};

type PackingSlipSaveResult = {
  uri: string;
  fileName: string;
  sharedWithSystemDialog: boolean;
};

let cachedLogoDataUri: string | null = null;

async function getShipWiseLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;

  const logoAsset = Asset.fromModule(require("../assets/images/Shipwise_logo_t.png"));
  if (!logoAsset.localUri) {
    await logoAsset.downloadAsync();
  }

  const logoUri = logoAsset.localUri || logoAsset.uri;
  const base64 = await FileSystem.readAsStringAsync(logoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  cachedLogoDataUri = `data:image/png;base64,${base64}`;
  return cachedLogoDataUri;
}

function toFixed2(value: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.00";
  return numeric.toFixed(2);
}

function toPositiveNumber(value: any) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function getCartonDimensions(carton: CartonLike) {
  const source = carton.cartonDetails || carton;
  const length =
    toPositiveNumber((carton as any)?.boxLength) ||
    toPositiveNumber(source?.length) ||
    toPositiveNumber((source as any)?.boxLength) ||
    toPositiveNumber((carton as any)?.length);
  const breadth =
    toPositiveNumber((carton as any)?.boxWidth) ||
    toPositiveNumber((source as any)?.width) ||
    toPositiveNumber((source as any)?.breadth) ||
    toPositiveNumber((carton as any)?.width) ||
    toPositiveNumber((carton as any)?.breadth);
  const height =
    toPositiveNumber((carton as any)?.boxHeight) ||
    toPositiveNumber(source?.height) ||
    toPositiveNumber((carton as any)?.height);
  return { length, breadth, height };
}

function resolveOrientationDimensions(orientation: any) {
  if (Array.isArray(orientation?.dims) && orientation.dims.length >= 3) {
    return {
      length: toPositiveNumber(orientation.dims[0]),
      breadth: toPositiveNumber(orientation.dims[1]),
      height: toPositiveNumber(orientation.dims[2]),
    };
  }

  return { length: 0, breadth: 0, height: 0 };
}

function getUsedDimensions(carton: CartonLike) {
  const fromOrientation = carton.orientationDetails?.dimensionsUsed;
  if (fromOrientation) {
    return {
      length: Number(fromOrientation.length || 0),
      breadth: Number(fromOrientation.breadth || 0),
      height: Number(fromOrientation.height || 0),
    };
  }

  const packedItems = Array.isArray(carton.layout?.packedItems)
    ? carton.layout.packedItems
    : [];
  if (packedItems.length > 0) {
    let maxLength = 0;
    let maxBreadth = 0;
    let maxHeight = 0;

    for (const packed of packedItems) {
      const position: any = (packed as any)?.position || {};
      const dimensions: any = (packed as any)?.dimensions || {};
      maxLength = Math.max(maxLength, Number(position.x || 0) + Number(dimensions.length || 0));
      maxBreadth = Math.max(
        maxBreadth,
        Number(position.y || 0) + Number(dimensions.width ?? dimensions.breadth ?? 0),
      );
      maxHeight = Math.max(maxHeight, Number(position.z || 0) + Number(dimensions.height || 0));
    }

    if (maxLength > 0 && maxBreadth > 0 && maxHeight > 0) {
      return {
        length: maxLength,
        breadth: maxBreadth,
        height: maxHeight,
      };
    }
  }

  const arrangement: any = (carton.layout as any)?.arrangement;
  const orientationDimensions = resolveOrientationDimensions((carton as any)?.orientation);
  if (arrangement && orientationDimensions.length > 0) {
    const arrangedLength = toPositiveNumber(arrangement.lengthwise) * orientationDimensions.length;
    const arrangedBreadth = toPositiveNumber(arrangement.breadthwise) * orientationDimensions.breadth;
    const arrangedHeight = toPositiveNumber(arrangement.layers) * orientationDimensions.height;

    if (arrangedLength > 0 && arrangedBreadth > 0 && arrangedHeight > 0) {
      return {
        length: arrangedLength,
        breadth: arrangedBreadth,
        height: arrangedHeight,
      };
    }
  }

  const fullDimensions = getCartonDimensions(carton);
  if (fullDimensions.length > 0 && fullDimensions.breadth > 0 && fullDimensions.height > 0) {
    return {
      length: fullDimensions.length,
      breadth: fullDimensions.breadth,
      height: fullDimensions.height,
    };
  }

  console.warn("[PackingSlip] Missing dimensionsUsed for carton", {
    cartonId: (carton as any)?.cartonId,
    cartonName: (carton as any)?.cartonName,
  });
  return {
    length: 0,
    breadth: 0,
    height: 0,
  };
}

function buildInvoiceFileName(generatedAt: Date) {
  const timestamp = generatedAt.getTime();
  return `ShipWise_${timestamp}.pdf`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getOrientationLabel(orientation?: string | null) {
  if (orientation === "H×L×B") return "Standing Upright";
  if (orientation === "L×B×H" || orientation === "L×W×H") {
    return "Flat on Base";
  }
  return "Side Laying";
}

export function buildPackingSlipHtml(input: PackingSlipInput) {
  const timestamp = (input.generatedAt || new Date()).toLocaleString();
  const cartons = Array.isArray(input.cartons) ? input.cartons : [];
  const packedQty = Math.max(
    0,
    Number(input.packedQty || cartons.reduce((sum, carton) => sum + Number(carton.itemsPacked || 0), 0)),
  );
  const cartonsUsed = cartons.length;

  const totalWeightKg = (packedQty * Number(input.productWeightGrams || 0)) / 1000;
  const logoDataUri = input.logoDataUri || "";

  type GroupedInstruction = {
    boxType: string;
    quantityOfBoxes: number;
    itemsPerBox: number;
    orientationLabel: string;
    dimensions: string;
  };

  const groupedInstructions: GroupedInstruction[] = Array.from(
    cartons
      .reduce((groups: Map<string, GroupedInstruction>, carton) => {
        const boxType =
          (carton as any)?.boxName ||
          (carton as any)?.cartonDetails?.name ||
          carton.cartonName ||
          "Box";
        const orientationLabel = getOrientationLabel(carton.orientation);
        const itemsPerBox = Number(carton.itemsPacked || 0);
        const usedDimensions = getUsedDimensions(carton);
        const fullDimensions = getCartonDimensions(carton);
        const usedLabel = `${toFixed2(usedDimensions.length)}x${toFixed2(usedDimensions.breadth)}x${toFixed2(usedDimensions.height)}`;

        const key = `${boxType}__${usedLabel}__${orientationLabel}__${itemsPerBox}`;
        const previous = groups.get(key) || {
          boxType,
          quantityOfBoxes: 0,
          itemsPerBox,
          orientationLabel,
          dimensions: usedLabel,
        };

        groups.set(key, {
          ...previous,
          quantityOfBoxes: previous.quantityOfBoxes + 1,
        });

        return groups;
      }, new Map<string, GroupedInstruction>())
      .values(),
  );

  const instructionRows = groupedInstructions
    .map(
      (instruction, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(instruction.boxType)}</td>
          <td>${instruction.quantityOfBoxes}</td>
          <td>${instruction.itemsPerBox}</td>
          <td>${escapeHtml(instruction.orientationLabel)}</td>
          <td>${instruction.dimensions}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <html>
      <head>
        <style>
          @page {
            margin: 26px 24px 72px;
          }

          body {
            font-family: 'Inter', 'Roboto', Arial, sans-serif;
            color: #1B2C3F;
            margin: 0;
            position: relative;
          }

          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60vw;
            max-width: 460px;
            opacity: 0.05;
            z-index: 0;
            pointer-events: none;
          }

          .watermark img {
            width: 100%;
            height: auto;
            display: block;
          }

          .content {
            position: relative;
            z-index: 1;
          }

          .header {
            border-top: 5px solid #007FFF;
            padding-top: 14px;
            margin-bottom: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 3;
          }

          .logo {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .logo img {
            width: 130px;
            height: auto;
            display: block;
            image-rendering: auto;
          }

          .logo-text {
            font-size: 24px;
            font-weight: 800;
            color: #0E4D7A;
          }

          .doc-title {
            font-size: 20px;
            font-weight: 800;
            color: #0B3C6D;
            letter-spacing: 1px;
          }

          .meta {
            margin-bottom: 12px;
            font-size: 12px;
            color: #4E647A;
          }

          .section {
            border: 1px solid #D9E4EE;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 12px;
            background: #FFFFFF;
          }

          .summary {
            background: #EDF4FB;
          }

          .title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #1F3F62;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px 12px;
            font-size: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #D9E4EE;
            padding: 7px;
            font-size: 11px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #EFF5FB;
            color: #1E3A58;
            font-weight: 700;
          }

          .footer-note {
            margin-top: 10px;
            font-size: 10px;
            color: #556B80;
          }

          .signature-wrap {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            margin-top: 26px;
          }

          .signature-block {
            width: 48%;
            font-size: 11px;
            color: #2F4A63;
          }

          .signature-line {
            margin-top: 22px;
            border-bottom: 1px solid #6F869D;
            height: 1px;
          }

          .page-footer {
            position: fixed;
            bottom: 22px;
            right: 24px;
            font-size: 10px;
            color: #5A7085;
          }

          .page-footer .pages::after {
            content: counter(page) + 1 ' of ' counter(pages) + 1;
          }
        </style>
      </head>
      <body>
        <div class="watermark">
          ${
            logoDataUri
              ? `<img src="${logoDataUri}" alt="ShipWise watermark" />`
              : ""
          }
        </div>
        <div class="content">
          <div class="header">
            <div class="logo">
              ${
                logoDataUri
                  ? `<img src="${logoDataUri}" alt="ShipWise" />`
                  : ""
              }
              <div class="logo-text">ShipWise</div>
            </div>
            <div class="doc-title">PACKING SLIP</div>
          </div>
          <div class="meta">Generated: ${escapeHtml(timestamp)}</div>

          <div class="section summary">
            <div class="title">Section 1: Summary</div>
            <div class="summary-grid">
              <div><strong>Total Items:</strong> ${packedQty}</div>
              <div><strong>Total Cartons:</strong> ${cartonsUsed}</div>
              <div><strong>Total Weight:</strong> ${toFixed2(totalWeightKg)} kg</div>
            </div>
          </div>

          <div class="section">
            <div class="title">Section 2: Product Specs</div>
            <table>
              <tr><th>Product</th><td>${escapeHtml(input.productName || "N/A")}</td></tr>
              <tr><th>Dimensions</th><td>${escapeHtml(input.productDimensions || "N/A")}</td></tr>
              <tr><th>Fragility</th><td>${input.isFragile ? "Fragile" : "Standard"}</td></tr>
              <tr><th>Preferred Orientation</th><td>${escapeHtml(getOrientationLabel(input.preferredOrientation))}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="title">Section 3: Packing Instructions</div>
            <table>
              <tr>
                <th>Step</th>
                <th>Box Type</th>
                <th>Quantity of Boxes</th>
                <th>Items per Box</th>
                <th>Orientation</th>
                <th>Dimensions Used</th>
              </tr>
              ${instructionRows}
            </table>
          </div>

          <div class="signature-wrap">
            <div class="signature-block">
              Prepared By:
              <div class="signature-line"></div>
            </div>
            <div class="signature-block">
              Warehouse Manager:
              <div class="signature-line"></div>
            </div>
          </div>

          <div class="footer-note">
            This is a computer-generated document. No signature is required for digital verification.
          </div>

          <div class="page-footer">Page <span class="pages"></span></div>
        </div>
      </body>
    </html>
  `;
}

export async function generateAndSharePackingSlip(input: PackingSlipInput) {
  const logoDataUri = input.logoDataUri || (await getShipWiseLogoDataUri());
  const generatedAt = input.generatedAt || new Date();
  const fileName = buildInvoiceFileName(generatedAt);
  const html = buildPackingSlipHtml({
    ...input,
    generatedAt,
    logoDataUri,
  });
  const printedFile = await Print.printToFileAsync({ html });
  const cacheDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;

  if (!cacheDirectory) {
    throw new Error("Unable to access local storage for export.");
  }

  const namedFileUri = `${cacheDirectory}${fileName}`;

  await FileSystem.copyAsync({
    from: printedFile.uri,
    to: namedFileUri,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Unable to open system save dialog on this device.");
  }

  await Sharing.shareAsync(namedFileUri, {
    mimeType: "application/pdf",
    dialogTitle: "Save Invoice",
    UTI: "com.adobe.pdf",
  });

  return {
    uri: namedFileUri,
    fileName,
    sharedWithSystemDialog: true,
  } satisfies PackingSlipSaveResult;
}
