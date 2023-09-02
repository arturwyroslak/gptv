import type { APIRoute } from "astro";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval
} from "eventsource-parser";
import { checkForPluginOperation, communicateWithOpenAI } from './helperFunctions'; // Zaimportuj funkcje

const localEnv = import.meta.env.OPENAI_API_KEY;
const vercelEnv = process.env.OPENAI_API_KEY;

const apiKeys = ((localEnv || vercelEnv)?.split(/\s*\|\s*/) ?? []).filter(
  Boolean
);

export const post: APIRoute = async context => {
  const body = await context.request.json();
  const apiKey = apiKeys.length
    ? apiKeys[Math.floor(Math.random() * apiKeys.length)]
    : "";
  let { messages, key = apiKey, temperature = 0.6 } = body;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (!key.startsWith("sk-")) key = apiKey;
  if (!key) {
    return new Response("Klucz witryny został zaktualizowany!");
  }
  if (!messages) {
    return new Response("Nie wprowadzono żadnego tekstu");
  }

  // Sprawdzenie, czy wiadomość może być dopasowana do pluginu
  const canMatchToPlugin = await checkForPluginOperation(messages[0]?.content || '');

  if (canMatchToPlugin) {
    const pluginResponse = await communicateWithOpenAI(messages[0]?.content || '', key);
    return new Response(JSON.stringify({
      type: 'plugin',
      message: '<kbd>Uruchamiam plugin</kbd>',
      pluginData: pluginResponse
    }));
  } else {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      method: "POST",
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        temperature,
        stream: true
      })
    });

    const stream = new ReadableStream({
      async start(controller) {
        const streamParser = (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === "event") {
            const data = event.data;
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices[0].delta?.content;
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              controller.error(e);
            }
          }
        };

        const parser = createParser(streamParser);
        for await (const chunk of completion.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      }
    });

    return new Response(stream);
  }
};
