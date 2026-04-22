import axios from "axios";
import { generateKlingToken } from "./kling.js";

const checkBalance = async () => {
  const token = generateKlingToken();

  const now = Date.now();
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  try {
    const response = await axios.get(
      "https://api-singapore.klingai.com/account/costs",
      {
        params: {
          start_time: oneMonthAgo,
          end_time: now,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("\n🔥 FULL RAW RESPONSE:\n");
    console.log("Status:", response.status);
    console.log("Full response:", JSON.stringify(response.data, null, 2));
    console.log("Headers:", response.headers);

  } catch (error) {
    console.log("❌ ERROR:");

    if (error.response) {
      console.dir(error.response.data, { depth: null });
    } else {
      console.log(error.message);
    }
  }
};

checkBalance();