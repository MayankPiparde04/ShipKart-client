const os = require("os");
const fs = require("fs");
const path = require("path");

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  let fallbackIp = "localhost";

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        // Avoid WSL, Hyper-V, VMware, VirtualBox if possible
        const lowerName = name.toLowerCase();
        if (
          !lowerName.includes("vmware") &&
          !lowerName.includes("virtual") &&
          !lowerName.includes("veth") &&
          !lowerName.includes("wsl")
        ) {
          // If it's a Wi-Fi or Ethernet adapter, return it immediately
          if (lowerName.includes("wi-fi") || lowerName.includes("ethernet")) {
            return iface.address;
          }
          fallbackIp = iface.address;
        }
      }
    }
  }
  return fallbackIp !== "localhost" ? fallbackIp : "10.0.2.2";
}

const ip = getLocalIpAddress();
console.log(`[Auto-IP] Detected Local IP address: ${ip}`);

const envPath = path.join(__dirname, "..", ".env");
let envContent = "";

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, "utf8");
}

const apiVar = `EXPO_PUBLIC_API_URL=http://${ip}:5000/api`;
const regex = /^EXPO_PUBLIC_API_URL=.*$/m;

if (regex.test(envContent)) {
  envContent = envContent.replace(regex, apiVar);
} else {
  if (envContent && !envContent.endsWith("\n")) {
    envContent += "\n";
  }
  envContent += `${apiVar}\n`;
}

fs.writeFileSync(envPath, envContent);
console.log(`[Auto-IP] Successfully injected API URL into .env file.`);
