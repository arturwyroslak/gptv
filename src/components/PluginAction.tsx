import { createSignal, createEffect } from "solid-js";
import { communicateWithOpenAI } from "./helperFunctions"; // Zaimportuj funkcję

interface PluginActionProps {
  pluginList: any[];
}

const PluginAction: Solid.FC<PluginActionProps> = (props) => {
  const [enabledPlugins, setEnabledPlugins] = createSignal<string[]>([]);

  const onTogglePlugin = (pluginUrl: string) => {
    setEnabledPlugins((prevState) => {
      if (prevState.includes(pluginUrl)) {
        return prevState.filter((url) => url !== pluginUrl);
      } else {
        return [...prevState, pluginUrl];
      }
    });
  };

  createEffect(async () => {
    const response = await communicateWithOpenAI("some message", "your_openai_key", enabledPlugins());
    // Zrób coś z odpowiedzią, jeśli to konieczne
  });

  return (
    <div className="plugin-action">
      {props.pluginList.map((plugin, index) => (
        <div key={index}>
          <img src={plugin.logo_url} alt={plugin.name_for_human} width="50" />
          <h3>{plugin.name_for_human}</h3>
          <p>{plugin.description_for_human}</p>
          <input
            type="checkbox"
            id={plugin.url}
            value={plugin.url}
            onChange={() => onTogglePlugin(plugin.url)}
          />
          <label htmlFor={plugin.url}>Enable</label>
        </div>
      ))}
    </div>
  );
};

export default PluginAction;
