const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({ region: "us-east-1" });

async function askOpus(prompt) {
  const modelId = "us.anthropic.claude-opus-4-6-v1"; 
  
  const messages = [{ role: "user", content: [{ text: prompt }] }];

  try {
    const command = new ConverseCommand({
      modelId,
      messages,
      inferenceConfig: { maxTokens: 8192, temperature: 0.7 },
    });

    const response = await client.send(command);
    const text = response.output?.message?.content?.[0]?.text ?? "";
    console.log(text);
  } catch (error) {
    console.error("\nFehler beim Aufruf von Bedrock:", error.message);
  }
}

const userPrompt = process.argv.slice(2).join(" ");
if (userPrompt) {
  askOpus(userPrompt);
} else {
  let input = "";
  process.stdin.on("data", (chunk) => { input += chunk; });
  process.stdin.on("end", () => {
    const trimmed = input.trim();
    if (trimmed) {
      askOpus(trimmed);
    } else {
      console.log("Benutzung: node ask-opus.cjs \"Deine Frage\"");
      console.log("  Oder:  Get-Content prompt.txt | node ask-opus.cjs");
    }
  });
}
