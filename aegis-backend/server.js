require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const AGENT_ID = "ef6d00ae-9490-42ff-a63c-7ed57b762e44";
const PORT = 3000;

// Health check
app.get("/api/decision", (req, res) => {
  res.json({
    status: "AEGIS backend alive",
    note: "POST to invoke Decision Agent"
  });
});

// IAM token
async function getIamToken() {
  const response = await axios.post(
    process.env.IAM_URL,
    `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${process.env.IBM_API_KEY}`,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    }
  );
  return response.data.access_token;
}

// Decision invocation
app.post("/api/decision", async (req, res) => {
  try {
    const token = await getIamToken();

    const agentResponse = await axios.post(
      `${process.env.WATSONX_URL}/orchestrate/assistant/agents/${AGENT_ID}/messages`,
      {
        input: {
          // deterministic, single-shot execution
          message: JSON.stringify(req.body)
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      success: true,
      aegis_output: agentResponse.data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`AEGIS backend running on http://localhost:${PORT}`);
});
