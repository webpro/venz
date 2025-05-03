import { createEffect, createResource, createSignal, For, Match, Switch, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate, useParams } from '@solidjs/router';
import { type Configuration, type Series, type SimpleCommand, generateCommand, configTypes } from '@venz/shared';
import { getNextAvailableColor } from '@venz/shared';
import { getStorageAdapter } from '../storage';
import { useToast } from '../stores/toast';
import { Button, ButtonLink, ButtonLinkInverted, DangerButton } from './Button';
import { ColorInput, CommandInput, Input, Select } from './Form';

const storage = getStorageAdapter();

const ConfigurationForm: Component<{ isNew?: boolean }> = props => {
  const navigate = useNavigate();
  const params = useParams();
  const { addToast } = useToast();
  const [configs, { mutate }] = createResource(() => storage.getConfigs());
  const [selectedConfig, setSelectedConfig] = createSignal<null | Configuration>(null);
  const [isEditing, setIsEditing] = createSignal(false);
  const [config, setConfig] = createStore<Configuration>({
    id: -1,
    title: '',
    type: 'hyperfine-default',
    series: [],
  });

  const [series, setSeries] = createStore<Series[]>(config.series ?? []);
  const [prepare, setPrepare] = createStore<SimpleCommand[]>(config.prepare ?? []);
  const [build, setBuild] = createStore<SimpleCommand[]>(config.build ?? []);
  const [isDirty, setIsDirty] = createSignal(false);

  createEffect(() => {
    if (params.id && configs()) {
      const config = configs()?.find(c => c.id === Number(params.id));

      if (config) {
        setConfig(config);
        setSelectedConfig(config);
        setSeries(config.series ?? [{ label: '', command: '', color: getNextAvailableColor() }]);
        setPrepare(config.prepare ?? [{ command: '' }]);
        setBuild(config.build ?? [{ command: '' }]);
        setIsEditing(true);
        setIsDirty(false);
      }
    }
  });

  if (props.isNew) {
    setSelectedConfig(null);
    setConfig({ title: '', type: 'standard', series: [], prepare: [], build: [] });
    setSeries([{ label: '', command: '', color: getNextAvailableColor() }]);
    setPrepare([{ command: '' }]);
    setBuild([{ command: '' }]);
    setIsEditing(true);
    setIsDirty(true);
  }

  const removeSeries = (index: number) => {
    setSeries(c => c.filter((_, i) => i !== index));
    setIsDirty(true);
    handleSave();
  };

  const handleSave = async () => {
    if (!isDirty()) return;
    if (!config.title || !config.type) return;
    const validSeries = series.filter(cmd => cmd.label.trim() || cmd.command?.trim());
    if (validSeries.length === 0) return;

    const configData = {
      ...config,
      prepare: prepare.filter(cmd => cmd.command.trim()),
      build: build.filter(cmd => cmd.command.trim()),
      series: validSeries.map((w, id) => ({ ...w, id: w.id ?? id })),
    };

    try {
      if (selectedConfig()) {
        await storage.updateConfig(selectedConfig()?.id, configData);
      } else {
        const { id } = await storage.saveConfig(configData);
        navigate(`/config/${id}`, { replace: true });
      }

      setIsDirty(false);
      addToast('Saved');
    } catch (error) {
      addToast(error.message, 'error');
      console.error('Failed to save configuration:', error);
    }
  };

  createEffect(() => {
    const nonEmptyPrepare = series.filter(
      (cmd, index) => index === series.length - 1 || cmd.command?.trim() || cmd.label.trim(),
    );
    const lastCommand = nonEmptyPrepare[nonEmptyPrepare.length - 1];
    if (
      series[series.length - 1]?.label === '' &&
      series[series.length - 1]?.command === '' &&
      series[series.length - 2]?.label === '' &&
      series[series.length - 2]?.command === ''
    ) {
      setSeries(series.toSpliced(-1));
    } else if (!lastCommand || lastCommand.command || lastCommand.label) {
      setSeries(series.concat({ label: '', command: '', color: getNextAvailableColor(series) }));
    }
  });

  createEffect(() => {
    const nonEmptyPrepare = prepare.filter((cmd, index) => index === prepare.length - 1 || cmd.command.trim());
    const lastCommand = nonEmptyPrepare[nonEmptyPrepare.length - 1];
    if (prepare[prepare.length - 1]?.command === '' && prepare[prepare.length - 2]?.command === '') {
      setPrepare(prepare.toSpliced(-1));
    } else if (!lastCommand || lastCommand.command) {
      setPrepare(prepare.concat({ command: '' }));
    }
  });

  createEffect(() => {
    const nonEmptyBuild = build.filter((cmd, index) => index === build.length - 1 || cmd.command.trim());
    const lastCommand = nonEmptyBuild[nonEmptyBuild.length - 1];
    if (build[build.length - 1]?.command === '' && build[build.length - 2]?.command === '') {
      setBuild(build.toSpliced(-1));
    } else if (!lastCommand || lastCommand.command) {
      setBuild(build.concat({ command: '' }));
    }
  });

  createEffect(() => {
    series.forEach((cmd, cmdIndex) => {
      const prepare = cmd.prepare || [];
      const nonEmptyPrepare = prepare.filter((cmd, index) => index === prepare.length - 1 || cmd.command.trim());
      const lastCommand = nonEmptyPrepare[nonEmptyPrepare.length - 1];
      if (prepare[prepare.length - 1]?.command === '' && prepare[prepare.length - 2]?.command === '') {
        setSeries(cmdIndex, 'prepare', prepare.toSpliced(-1));
      } else if (!lastCommand || lastCommand.command) {
        setSeries(cmdIndex, 'prepare', prepare.concat({ command: '' }));
      }
    });
  });

  return (
    <div class="flex flex-col">
      <div class="flex flex-col min-[660px]:flex-row gap-8 lg:gap-16">
        <nav role="navigation" class="w-full min-[660px]:w-1/4 flex flex-col gap-4">
          <ButtonLink href="/">Drop data →</ButtonLink>

          <ButtonLink href="/new">New configuration</ButtonLink>

          {configs()?.map(config => {
            const isSelected = selectedConfig()?.id === config.id;
            return (
              <ButtonLinkInverted href={`/config/${config.id}`} classList={{ 'border-blue-500': isSelected }}>
                {config.title}
              </ButtonLinkInverted>
            );
          })}
        </nav>

        <div class="flex-1 w-full min-[800px]:w-3/4 flex flex-col gap-16">
          <Show when={isEditing() || selectedConfig()}>
            <form
              class="w-full flex flex-col gap-8"
              onSubmit={event => {
                event.preventDefault();
                handleSave();
              }}
            >
              <button type="submit" class="hidden" />
              <div class="flex flex-col gap-4">
                <label for="config-title">Title</label>
                <Input
                  id="config-title"
                  value={config.title}
                  onInput={event => {
                    setConfig('title', event.currentTarget.value);
                    setIsDirty(true);
                  }}
                  onBlur={handleSave}
                />
              </div>

              <div class="flex flex-col gap-4">
                <label for="config-type">Type</label>
                <Select
                  id="config-type"
                  value={config.type}
                  onChange={event => {
                    setConfig('type', event.currentTarget.value);
                    handleSave();
                    setIsDirty(true);
                  }}
                >
                  <For each={configTypes}>{type => <option value={type}>{type}</option>}</For>
                </Select>
              </div>

              <Switch>
                <Match when={config.type === 'hyperfine-default'}>
                  <h2>Commands</h2>

                  <div class="flex flex-col gap-2">
                    <For each={series}>
                      {(command, i) => (
                        <div class="flex items-center gap-2 relative">
                          <Input
                            value={command.label}
                            placeholder="Label"
                            onInput={event => {
                              setSeries(i(), 'label', event.currentTarget.value);
                              setConfig('series', series);
                              setIsDirty(true);
                            }}
                            onBlur={selectedConfig() && handleSave}
                          />
                          <CommandInput
                            value={command.command}
                            placeholder="Command"
                            onInput={event => {
                              setSeries(i(), 'command', event.currentTarget.value);
                              setConfig('series', series);
                              setIsDirty(true);
                            }}
                            onBlur={selectedConfig() && handleSave}
                          />
                          <div class="relative w-10">
                            <ColorInput
                              value={command.color}
                              onInput={event => {
                                setSeries(i(), 'color', event.currentTarget.value);
                                setIsDirty(true);
                              }}
                              onChange={handleSave}
                            />
                            <div
                              class="pointer-events-none absolute inset-0"
                              style={{ 'background-color': command.color }}
                            />
                          </div>
                          {i() !== series.length - 1 && (
                            <button
                              type="button"
                              onClick={() => removeSeries(i())}
                              class="w-10 flex items-center justify-center text-red-500 hover:text-red-700 absolute -right-12"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}
                    </For>
                  </div>
                </Match>

                <Match when={config.type === 'hyperfine-parameter'}>
                  <div class="flex flex-col gap-4">
                    <label for="param-command">Command</label>
                    <Input
                      id="param-command"
                      value={config.command}
                      onInput={event => {
                        setConfig('command', event.currentTarget.value);
                        setIsDirty(true);
                      }}
                      onBlur={handleSave}
                    />
                  </div>

                  <div class="flex flex-col gap-4">
                    <label for="param-name">Parameter name</label>
                    <Input
                      id="param-name"
                      value={config.parameterName}
                      onInput={event => {
                        setConfig('parameterName', event.currentTarget.value);
                        setIsDirty(true);
                      }}
                      onBlur={handleSave}
                    />
                  </div>

                  <h2>Parameter values</h2>

                  <div class="flex flex-col gap-2">
                    <For each={series}>
                      {(workload, i) => (
                        <div class="flex items-center gap-2 relative">
                          <CommandInput
                            type="text"
                            value={workload.label}
                            placeholder="Parameter value"
                            onInput={event => {
                              setSeries(i(), 'label', event.currentTarget.value);
                              setSeries(
                                i(),
                                'command',
                                config.command.replace(`{${config.name}}`, event.currentTarget.value),
                              );
                              setConfig('series', series);
                              setIsDirty(true);
                            }}
                            onBlur={selectedConfig() && handleSave}
                          />
                          <div class="relative w-10">
                            <ColorInput
                              value={workload.color}
                              onInput={event => {
                                setSeries(i(), 'color', event.currentTarget.value);
                                setConfig('series', series);
                                setIsDirty(true);
                              }}
                              onChange={handleSave}
                              class="w-full h-[39px] cursor-pointer appearance-none bg-transparent border-0"
                            />
                            <div
                              class="pointer-events-none absolute inset-0"
                              style={{ 'background-color': workload.color }}
                            />
                          </div>
                          {i() !== series.length - 1 && (
                            <button
                              type="button"
                              onClick={() => removeSeries(i())}
                              class="w-10 flex items-center justify-center text-red-500 hover:text-red-700 absolute -right-12"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}
                    </For>
                  </div>
                </Match>

                <Match when={config.type === 'standard'}>
                  <div class="flex flex-col gap-4">
                    <label for="labelX">X-axis label</label>
                    <Input
                      id="labelX"
                      value={config.labelX || 'run #'}
                      onInput={event => {
                        setConfig('labelX', event.currentTarget.value);
                        setIsDirty(true);
                      }}
                      onBlur={handleSave}
                    />
                  </div>

                  <div class="flex flex-col gap-4">
                    <label for="labelY">Y-axis label</label>
                    <Input
                      id="labelY"
                      value={config.labelY || 'median (s)'}
                      onInput={event => {
                        setConfig('labelY', event.currentTarget.value);
                        setIsDirty(true);
                      }}
                      onBlur={handleSave}
                    />
                  </div>

                  <h2>Series</h2>

                  <div class="flex flex-col gap-2">
                    <For each={series}>
                      {(workload, i) => (
                        <div class="flex items-center gap-2 relative">
                          <CommandInput
                            type="text"
                            value={workload.label}
                            placeholder="Label"
                            onInput={event => {
                              setSeries(i(), 'label', event.currentTarget.value);
                              setConfig('series', series);
                              setIsDirty(true);
                            }}
                            onBlur={selectedConfig() && handleSave}
                          />
                          <div class="relative w-10">
                            <ColorInput
                              value={workload.color}
                              onInput={event => {
                                setSeries(i(), 'color', event.currentTarget.value);
                                setConfig('series', series);
                                setIsDirty(true);
                              }}
                              onChange={handleSave}
                              class="w-full h-[39px] cursor-pointer appearance-none bg-transparent border-0"
                            />
                            <div
                              class="pointer-events-none absolute inset-0"
                              style={{ 'background-color': workload.color }}
                            />
                          </div>
                          {i() !== series.length - 1 && (
                            <button
                              type="button"
                              onClick={() => removeSeries(i())}
                              class="w-10 flex items-center justify-center text-red-500 hover:text-red-700 absolute -right-12"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}
                    </For>
                  </div>
                </Match>

                <Match when={config.type === 'list'}>
                  <h4>Prepare</h4>

                  <div class="flex flex-col">
                    <For each={prepare}>
                      {(command, i) => (
                        <CommandInput
                          value={command.command}
                          placeholder="command"
                          onInput={event => {
                            setPrepare(i(), 'command', event.currentTarget.value);
                            setIsDirty(true);
                          }}
                          onBlur={handleSave}
                        />
                      )}
                    </For>
                  </div>

                  <h4>
                    List (print one <code>$KEY</code> per line)
                  </h4>

                  <Input
                    id="list-command"
                    value={config.command || ''}
                    placeholder="command"
                    onInput={event => {
                      setConfig('command', event.currentTarget.value);
                      setIsDirty(true);
                    }}
                    onBlur={handleSave}
                  />

                  <div class="flex flex-col gap-4">
                    <label>Sort (sort $KEY)</label>
                    <Select
                      value={config.sort ?? 'default'}
                      onChange={event => {
                        setConfig('sort', event.currentTarget.value);
                        handleSave();
                        setIsDirty(true);
                      }}
                    >
                      <For each={['default', 'semver', 'datetime']}>{type => <option value={type}>{type}</option>}</For>
                    </Select>
                  </div>

                  <div class="flex flex-col gap-4">
                    <label for="labelX">X-axis label</label>
                    <Input
                      id="labelX"
                      value={config.labelX || 'run #'}
                      onInput={event => {
                        setConfig('labelX', event.currentTarget.value);
                        setIsDirty(true);
                      }}
                      onBlur={handleSave}
                    />
                  </div>

                  <div class="flex flex-col gap-4">
                    <label for="labelY">Y-axis label</label>
                    <Input
                      id="labelY"
                      value={config.labelY || 'median (s)'}
                      onInput={event => {
                        setConfig('labelY', event.currentTarget.value);
                        setIsDirty(true);
                      }}
                      onBlur={handleSave}
                    />
                  </div>

                  <h4>
                    Build (use <code>$KEY</code>)
                  </h4>

                  <div class="flex flex-col">
                    <For each={build}>
                      {(command, i) => (
                        <div class="flex items-center gap-4">
                          <CommandInput
                            type="text"
                            value={command.command}
                            placeholder="command"
                            onInput={event => {
                              setBuild(i(), 'command', event.currentTarget.value);
                              setIsDirty(true);
                            }}
                            onBlur={handleSave}
                          />
                        </div>
                      )}
                    </For>
                  </div>

                  <h2>Series</h2>

                  <div class="flex flex-col gap-16">
                    <For each={series}>
                      {(command, i) => (
                        <div class="flex flex-col gap-2 relative">
                          <div class="flex items-center gap-2">
                            <Input
                              value={command.label}
                              placeholder="Label"
                              onInput={event => {
                                setSeries(i(), 'label', event.currentTarget.value);
                                setConfig('series', series);
                                setIsDirty(true);
                              }}
                              onBlur={handleSave}
                            />

                            <div class="relative w-10">
                              <ColorInput
                                value={command.color}
                                onInput={event => {
                                  setSeries(i(), 'color', event.currentTarget.value);
                                  setIsDirty(true);
                                }}
                                onChange={handleSave}
                              />
                              <div
                                class="pointer-events-none absolute inset-0"
                                style={{ 'background-color': command.color }}
                              />
                            </div>
                          </div>

                          <div class="flex flex-col">
                            <For each={command.prepare || [{ command: '' }]}>
                              {(prepCmd, prepIndex) => (
                                <div class="flex items-center">
                                  <CommandInput
                                    value={prepCmd.command}
                                    placeholder="Prepare command"
                                    onInput={event => {
                                      setSeries(i(), 'prepare', prepIndex(), 'command', event.currentTarget.value);
                                      setIsDirty(true);
                                    }}
                                    onBlur={handleSave}
                                  />
                                </div>
                              )}
                            </For>
                          </div>

                          <CommandInput
                            value={command.command}
                            placeholder="Command"
                            onInput={event => {
                              setSeries(i(), 'command', event.currentTarget.value);
                              setConfig('series', series);
                              setIsDirty(true);
                            }}
                            onBlur={handleSave}
                          />

                          {i() !== series.length - 1 && (
                            <button
                              type="button"
                              onClick={() => removeSeries(i())}
                              class="w-10 flex items-center justify-center text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}
                    </For>
                  </div>
                </Match>
              </Switch>
            </form>
          </Show>

          <Show
            when={
              selectedConfig() &&
              (config.type === 'hyperfine-default' || config.type === 'hyperfine-parameter') &&
              series.length > 0
            }
          >
            <div class="flex flex-col gap-4">
              <pre class="py-4 rounded-sm overflow-x-auto border relative light:bg-gray-200">
                <span class="select-none absolute left-4 text-foreground">$</span>
                <code class="text-wrap pl-8 pr-1 block ml-1">{generateCommand(config)}</code>
              </pre>

              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generateCommand(config).replace(/(\\\n)/g, ''));
                }}
              >
                Copy command (then paste in terminal)
              </Button>
            </div>
          </Show>

          <Show when={selectedConfig()?.id && series.length > 0}>
            <ButtonLink href={`/chart/${selectedConfig()?.id}`} state={{ type: config.type }}>
              Go to chart →
            </ButtonLink>
          </Show>

          <Show when={selectedConfig()}>
            <div class="self-end">
              <DangerButton
                onClick={async () => {
                  if (!confirm('Are you sure you want to delete this configuration?')) return;

                  await storage.deleteConfig(selectedConfig().id);
                  mutate(configs().filter((c: any) => c.id !== selectedConfig().id));
                  setSelectedConfig(null);
                  navigate('/config');
                  addToast('Configuration deleted');
                }}
              >
                Delete configuration
              </DangerButton>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationForm;
