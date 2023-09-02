import React from 'react';

interface PluginActionProps {
  pluginList: any[];
  onTogglePlugin: (pluginUrl: string) => void;
}

const PluginAction: React.FC<PluginActionProps> = ({ pluginList, onTogglePlugin }) => {
  return (
    <div className="plugin-action">
      {pluginList.map((plugin, index) => (
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
