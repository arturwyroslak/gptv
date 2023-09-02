import axios from 'axios';
import SwaggerClient from 'swagger-client'; // Załóżmy, że używasz biblioteki swagger-client

export async function fetchPluginInfo(url: string) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching plugin info:", error);
    return null;
  }
}

export async function checkForPluginOperation(userMessage: string, apiKey: string) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  };
  
  const messages = [
    {
      role: "user",
      content: `Can this user message be matched to a plugin operation? "${userMessage}"`
    }
  ];

  const modelResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-3.5-turbo",
    messages: messages
  }, config);

  const responseContent = modelResponse.data.choices[0].message.content.toLowerCase();

  if (responseContent.includes("yes")) {
    return true;
  } else {
    return false;
  }
}

export async function communicateWithOpenAI(userMessage: string, apiKey: string) {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const canMatchToPlugin = await checkForPluginOperation(userMessage, apiKey);

    if (canMatchToPlugin) {
      const pluginUrls = [
        "https://example.com/plugin1.json",
        "https://example.com/plugin2.json"
      ];

      for (const url of pluginUrls) {
        const pluginInfo = await fetchPluginInfo(url);
        if (pluginInfo && pluginInfo.api && pluginInfo.api.url) {
          const client = await SwaggerClient(pluginInfo.api.url);
          const availableOperations = Object.keys(client.apis.default);

          const messages = [
            {
              role: "user",
              content: `Available operations: ${availableOperations.join(", ")}. User query: "${userMessage}". Which operation should be selected?`
            }
          ];

          const modelResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-3.5-turbo",
            messages: messages
          }, config);

          const selectedOperationId = modelResponse.data.choices[0].message.content.trim();
          const apiResponse = await client.apis.default[selectedOperationId]();
          const responseMessage = JSON.stringify(apiResponse.body);

          return {
            type: 'plugin',
            content: `<kbd>Uruchamiam plugin</kbd><div style="display:none">${responseMessage}</div>`
          };
        }
      }
    } else {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "user", content: userMessage }
        ]
      }, config);
      const botResponse = response.data.choices[0].message.content;
      return {
        type: 'text',
        content: botResponse
      };
    }
  } catch (error) {
    console.error("Error communicating with OpenAI:", error);
    return null;
  }
}
