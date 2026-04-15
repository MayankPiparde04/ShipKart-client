import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";
import { formatCurrencyInr } from "./currency";

type CartonLike = {
  cartonDetails?: {
    id?: string;
    name?: string;
    cost?: number;
    volume?: number;
  };
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toFixed2(value: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.00";
  return numeric.toFixed(2);
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
  const cartonBaseCost = Number(
    input.cartonBaseCost ??
      cartons.reduce((sum, carton) => sum + Number(carton.cartonDetails?.cost || 0), 0),
  );
  const shippingRatePerKg = Number(input.shippingRatePerKg ?? 18);
  const shippingCostByWeight = totalWeightKg * shippingRatePerKg;
  const fragileHandlingFee = Number(input.fragileHandlingFee ?? (input.isFragile ? 35 : 0));
  const estimatedCost = clamp(
    cartonBaseCost + shippingCostByWeight + fragileHandlingFee,
    0,
    Number.MAX_SAFE_INTEGER,
  );
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
        const boxType = carton.cartonDetails?.name || carton.cartonName || "Carton";
        const orientationLabel = getOrientationLabel(carton.orientation);
        const itemsPerBox = Number(carton.itemsPacked || 0);
        const dimensions = carton.orientationDetails?.dimensionsUsed
          ? `${carton.orientationDetails.dimensionsUsed.length} x ${carton.orientationDetails.dimensionsUsed.breadth} x ${carton.orientationDetails.dimensionsUsed.height}`
          : "N/A";

        const key = `${boxType}__${dimensions}__${orientationLabel}__${itemsPerBox}`;
        const previous = groups.get(key) || {
          boxType,
          quantityOfBoxes: 0,
          itemsPerBox,
          orientationLabel,
          dimensions,
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
            content: counter(page) ' of ' counter(pages);
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
              <div><strong>Estimated Cost:</strong> ${formatCurrencyInr(estimatedCost)}</div>
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
  const html = buildPackingSlipHtml({
    ...input,
    logoDataUri,
  });
  const file = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/pdf",
      dialogTitle: "Download PDF",
      UTI: "com.adobe.pdf",
    });
  }

  return file.uri;
}
