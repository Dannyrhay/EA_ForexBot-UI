import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronRight, RotateCcw, Save, AlertCircle, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { fetchConfig, updateConfig } from '@/services/api';

// All known strategies from the bot
const ALL_STRATEGIES = [
    'FVGPullback',
    'TrendlineBreakout',
    'Fibonacci',
    'SMC',
    'LiquiditySweep',
    'InstitutionalScalping',
    'VolumeReversal',
    'MalaysianSnR',
];
const FILTER_STRATEGIES = ['ADX'];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Settings() {
    const [expandedSections, setExpandedSections] = useState({
        mt5: true,
        general: false,
        riskManagement: false,
        strategies: false,
        tradingSessions: false,
        tradeManagement: false,
    });

    const [config, setConfig] = useState(null);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState("Never");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saveMessage, setSaveMessage] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchConfig();
            setConfig(data);
            setOriginalConfig(JSON.parse(JSON.stringify(data)));
            setLoading(false);
        } catch (err) {
            setError('Failed to load configuration. Make sure the bot is running.');
            setLoading(false);
            console.error('Error loading config:', err);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleInputChange = (path, value) => {
        setHasChanges(true);
        setSaveMessage(null);
        const keys = path.split('.');
        setConfig(prev => {
            const newConfig = JSON.parse(JSON.stringify(prev));
            let current = newConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newConfig;
        });
    };

    const handleArrayChange = (path, value) => {
        const arr = value.split(',').map(s => s.trim()).filter(s => s);
        handleInputChange(path, arr);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSaveMessage(null);
            const result = await updateConfig(config);
            setHasChanges(false);
            setOriginalConfig(JSON.parse(JSON.stringify(config)));
            const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            setLastSaved(now);
            setSaveMessage({ type: 'success', text: result.message || 'Configuration saved successfully!' });
            setSaving(false);
        } catch (err) {
            setSaveMessage({ type: 'error', text: 'Failed to save configuration.' });
            setSaving(false);
            console.error('Failed to save settings:', err);
        }
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to discard all changes?')) {
            setConfig(JSON.parse(JSON.stringify(originalConfig)));
            setHasChanges(false);
            setSaveMessage(null);
        }
    };

    // --- Reusable field components ---

    const SectionHeader = ({ title, section, description }) => (
        <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors rounded-lg"
        >
            <div className="flex flex-col items-start">
                <h3 className="text-lg font-semibold">{title}</h3>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            {expandedSections[section] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
    );

    const SubHeader = ({ title }) => (
        <div className="pt-4 pb-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h4>
        </div>
    );

    const InputField = ({ label, value, onChange, type = "text", step, min, max, suffix, placeholder, description }) => (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-border/50 last:border-0">
            <div className="flex-1">
                <label className="text-sm font-medium">{label}</label>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
                <input
                    type={type}
                    value={value ?? ''}
                    onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    step={step}
                    min={min}
                    max={max}
                    placeholder={placeholder}
                    className="w-48 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
            </div>
        </div>
    );

    const PasswordField = ({ label, value, onChange, description }) => (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-border/50 last:border-0">
            <div className="flex-1">
                <label className="text-sm font-medium">{label}</label>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-48 px-3 py-2 pr-10 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );

    const SwitchField = ({ label, checked, onChange, description }) => (
        <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
            <div className="flex-1">
                <label className="text-sm font-medium">{label}</label>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
            <Switch checked={checked ?? false} onCheckedChange={onChange} />
        </div>
    );

    const SelectField = ({ label, value, onChange, options, description }) => (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-border/50 last:border-0">
            <div className="flex-1">
                <label className="text-sm font-medium">{label}</label>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-48 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );

    const TagInput = ({ label, value = [], onChange, description, placeholder }) => (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-border/50 last:border-0">
            <div className="flex-1">
                <label className="text-sm font-medium">{label}</label>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <input
                type="text"
                value={Array.isArray(value) ? value.join(', ') : value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-64 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
        </div>
    );

    const CheckboxGroup = ({ items, checked = [], onChange }) => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={checked?.includes(item) ?? false}
                        onChange={(e) => {
                            const current = checked ?? [];
                            if (e.target.checked) {
                                onChange([...current, item]);
                            } else {
                                onChange(current.filter(s => s !== item));
                            }
                        }}
                        className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm">{item}</span>
                </label>
            ))}
        </div>
    );

    // --- Strategy param block helper ---
    const StrategyParamBlock = ({ title, children }) => (
        <div className="border border-border/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-base">{title}</h4>
            {children}
        </div>
    );

    // --- Loading / Error states ---

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading configuration...</p>
                </div>
            </div>
        );
    }

    if (error && !config) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <h3 className="text-xl font-semibold">Configuration Error</h3>
                    <p className="text-muted-foreground">{error}</p>
                    <button
                        onClick={loadConfig}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const riskMethod = config?.risk_management?.method ?? 'atr';

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Configure your trading bot parameters</p>
                </div>
            </div>

            {/* Messages */}
            {hasChanges && (
                <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500">You have unsaved changes</span>
                </div>
            )}

            {saveMessage && (
                <div className={`flex items-center gap-3 p-4 rounded-lg ${saveMessage.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                    {saveMessage.type === 'success' ? (
                        <Check className="w-5 h-5 text-green-500" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
                        }`}>{saveMessage.text}</span>
                </div>
            )}

            {/* ============================================================ */}
            {/* MT5 Credentials */}
            {/* ============================================================ */}
            <Card className="overflow-hidden">
                <SectionHeader title="MT5 Connection" section="mt5" description="MetaTrader 5 account credentials" />
                {expandedSections.mt5 && (
                    <CardContent className="space-y-1 pt-0">
                        <InputField
                            label="Login ID"
                            value={config?.mt5_credentials?.login}
                            onChange={(v) => handleInputChange('mt5_credentials.login', parseInt(v) || 0)}
                            type="number"
                            description="Your MT5 account number"
                        />
                        <PasswordField
                            label="Password"
                            value={config?.mt5_credentials?.password}
                            onChange={(v) => handleInputChange('mt5_credentials.password', v)}
                            description="Your MT5 account password"
                        />
                        <InputField
                            label="Server"
                            value={config?.mt5_credentials?.server}
                            onChange={(v) => handleInputChange('mt5_credentials.server', v)}
                            placeholder="e.g., Exness-MT5Real"
                            description="MT5 broker server name"
                        />
                        <InputField
                            label="Terminal Path"
                            value={config?.mt5_credentials?.mt5_terminal_path}
                            onChange={(v) => handleInputChange('mt5_credentials.mt5_terminal_path', v)}
                            placeholder="Leave empty for default"
                            description="Path to terminal64.exe (optional)"
                        />
                    </CardContent>
                )}
            </Card>

            {/* ============================================================ */}
            {/* General Settings */}
            {/* ============================================================ */}
            <Card className="overflow-hidden">
                <SectionHeader title="General Settings" section="general" description="Trading symbols, timeframes, and bot parameters" />
                {expandedSections.general && (
                    <CardContent className="space-y-1 pt-0">
                        <TagInput
                            label="Symbols"
                            value={config?.symbols}
                            onChange={(v) => handleArrayChange('symbols', v)}
                            description="Comma-separated list of trading symbols"
                            placeholder="BTCUSDm, XAUUSDm"
                        />
                        <TagInput
                            label="Timeframes"
                            value={config?.timeframes}
                            onChange={(v) => handleArrayChange('timeframes', v)}
                            description="Comma-separated list of timeframes"
                            placeholder="M5, M15, H1"
                        />
                        <InputField
                            label="Bars to Fetch"
                            value={config?.bars}
                            onChange={(v) => handleInputChange('bars', v)}
                            type="number"
                            min="50"
                            max="5000"
                            description="Number of candle bars to fetch per symbol"
                        />
                        <InputField
                            label="Max Trades Per Symbol"
                            value={config?.max_trades_per_symbol}
                            onChange={(v) => handleInputChange('max_trades_per_symbol', v)}
                            type="number"
                            min="1"
                            max="20"
                        />
                        <InputField
                            label="Cooldown Period"
                            value={config?.cooldown_period_minutes}
                            onChange={(v) => handleInputChange('cooldown_period_minutes', v)}
                            type="number"
                            min="0"
                            suffix="minutes"
                            description="Wait time between trades on the same symbol"
                        />
                        <InputField
                            label="Monitoring Interval"
                            value={config?.monitoring_interval_seconds}
                            onChange={(v) => handleInputChange('monitoring_interval_seconds', v)}
                            type="number"
                            min="1"
                            suffix="seconds"
                            description="Bot loop frequency"
                        />
                        <InputField
                            label="Error Sleep Interval"
                            value={config?.error_sleep_interval_seconds}
                            onChange={(v) => handleInputChange('error_sleep_interval_seconds', v)}
                            type="number"
                            min="10"
                            suffix="seconds"
                            description="Wait time after errors before retrying"
                        />
                        <InputField
                            label="Max Consecutive Failures"
                            value={config?.max_consecutive_trade_failures}
                            onChange={(v) => handleInputChange('max_consecutive_trade_failures', v)}
                            type="number"
                            min="1"
                            max="20"
                            description="Stop trading after this many consecutive failures"
                        />
                        <InputField
                            label="Max Consecutive Losses"
                            value={config?.max_consecutive_losses}
                            onChange={(v) => handleInputChange('max_consecutive_losses', v)}
                            type="number"
                            min="1"
                            max="50"
                            description="Halt trading after this many consecutive losing trades"
                        />
                        <InputField
                            label="DXY Symbol"
                            value={config?.dxy_symbol}
                            onChange={(v) => handleInputChange('dxy_symbol', v)}
                            description="DXY symbol name on your broker"
                            placeholder="DXYm"
                        />
                    </CardContent>
                )}
            </Card>

            {/* ============================================================ */}
            {/* Risk Management */}
            {/* ============================================================ */}
            <Card className="overflow-hidden">
                <SectionHeader title="Risk Management" section="riskManagement" description="Risk per trade, stop loss, and position sizing" />
                {expandedSections.riskManagement && (
                    <CardContent className="space-y-1 pt-0">
                        <SwitchField
                            label="Enable Risk Management"
                            checked={config?.risk_management?.enabled}
                            onChange={(v) => handleInputChange('risk_management.enabled', v)}
                            description="Master switch for SL/TP risk management"
                        />
                        <InputField
                            label="Risk Per Trade"
                            value={config?.risk_percent_per_trade != null ? config.risk_percent_per_trade * 100 : ''}
                            onChange={(v) => handleInputChange('risk_percent_per_trade', v / 100)}
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="10"
                            suffix="%"
                            description="Percentage of account to risk per trade"
                        />
                        <InputField
                            label="Max Risk Per Trade (RM)"
                            value={config?.risk_management?.max_risk_percent_per_trade}
                            onChange={(v) => handleInputChange('risk_management.max_risk_percent_per_trade', v)}
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="10"
                            suffix="%"
                            description="Hard limit on risk per trade within risk management"
                        />
                        <SelectField
                            label="SL/TP Method"
                            value={riskMethod}
                            onChange={(v) => handleInputChange('risk_management.method', v)}
                            options={[
                                { value: 'atr', label: 'ATR-Based' },
                                { value: 'percentage', label: 'Percentage' },
                                { value: 'fixed_pips', label: 'Fixed Pips' }
                            ]}
                            description="How to calculate Stop Loss and Take Profit"
                        />

                        {/* ATR Params - shown when method is 'atr' */}
                        {riskMethod === 'atr' && (
                            <>
                                <SubHeader title="ATR Parameters" />
                                <InputField
                                    label="ATR Period"
                                    value={config?.risk_management?.atr_params?.atr_period}
                                    onChange={(v) => handleInputChange('risk_management.atr_params.atr_period', v)}
                                    type="number"
                                    min="5"
                                    max="50"
                                />
                                <InputField
                                    label="SL ATR Multiplier"
                                    value={config?.risk_management?.atr_params?.sl_multiplier}
                                    onChange={(v) => handleInputChange('risk_management.atr_params.sl_multiplier', v)}
                                    type="number"
                                    step="0.1"
                                    min="0.5"
                                    max="5"
                                />
                                <InputField
                                    label="TP Risk:Reward Ratio"
                                    value={config?.risk_management?.atr_params?.tp_risk_reward_ratio}
                                    onChange={(v) => handleInputChange('risk_management.atr_params.tp_risk_reward_ratio', v)}
                                    type="number"
                                    step="0.5"
                                    min="1"
                                    max="10"
                                />
                            </>
                        )}

                        {/* Percentage Params */}
                        {riskMethod === 'percentage' && (
                            <>
                                <SubHeader title="Percentage Parameters" />
                                <InputField
                                    label="SL Percent"
                                    value={config?.risk_management?.percentage_params?.sl_percent}
                                    onChange={(v) => handleInputChange('risk_management.percentage_params.sl_percent', v)}
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="10"
                                    suffix="%"
                                />
                                <InputField
                                    label="TP Percent"
                                    value={config?.risk_management?.percentage_params?.tp_percent}
                                    onChange={(v) => handleInputChange('risk_management.percentage_params.tp_percent', v)}
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="20"
                                    suffix="%"
                                />
                            </>
                        )}

                        {/* Fixed Pips Params */}
                        {riskMethod === 'fixed_pips' && (
                            <>
                                <SubHeader title="Fixed Pips Parameters" />
                                <InputField
                                    label="SL Pips"
                                    value={config?.risk_management?.fixed_pips_params?.sl_pips}
                                    onChange={(v) => handleInputChange('risk_management.fixed_pips_params.sl_pips', v)}
                                    type="number"
                                    min="5"
                                    max="500"
                                />
                                <InputField
                                    label="TP Pips"
                                    value={config?.risk_management?.fixed_pips_params?.tp_pips}
                                    onChange={(v) => handleInputChange('risk_management.fixed_pips_params.tp_pips', v)}
                                    type="number"
                                    min="5"
                                    max="1000"
                                />
                            </>
                        )}

                        {/* Portfolio Risk */}
                        <SubHeader title="Portfolio Risk Limits" />
                        <SwitchField
                            label="Enable Portfolio Risk"
                            checked={config?.portfolio_risk?.enabled}
                            onChange={(v) => handleInputChange('portfolio_risk.enabled', v)}
                            description="Enable portfolio-level risk management"
                        />
                        <InputField
                            label="Max Daily Drawdown"
                            value={config?.portfolio_risk?.max_daily_drawdown_percent}
                            onChange={(v) => handleInputChange('portfolio_risk.max_daily_drawdown_percent', v)}
                            type="number"
                            step="1"
                            min="1"
                            max="50"
                            suffix="%"
                        />
                        <InputField
                            label="Max Portfolio Risk"
                            value={config?.portfolio_risk?.max_portfolio_risk_percent}
                            onChange={(v) => handleInputChange('portfolio_risk.max_portfolio_risk_percent', v)}
                            type="number"
                            step="1"
                            min="1"
                            max="100"
                            suffix="%"
                        />
                        <InputField
                            label="Max Margin Level"
                            value={config?.portfolio_risk?.max_margin_level_percent}
                            onChange={(v) => handleInputChange('portfolio_risk.max_margin_level_percent', v)}
                            type="number"
                            step="1"
                            min="1"
                            max="100"
                            suffix="%"
                        />
                        <InputField
                            label="Max Daily Trades Per Asset"
                            value={config?.portfolio_risk?.max_daily_trades_per_asset}
                            onChange={(v) => handleInputChange('portfolio_risk.max_daily_trades_per_asset', v)}
                            type="number"
                            min="1"
                            max="50"
                        />
                        <InputField
                            label="Halt After Consecutive Losses"
                            value={config?.portfolio_risk?.halt_after_consecutive_losses}
                            onChange={(v) => handleInputChange('portfolio_risk.halt_after_consecutive_losses', v)}
                            type="number"
                            min="1"
                            max="20"
                            description="Pause trading after N consecutive losing trades"
                        />
                    </CardContent>
                )}
            </Card>

            {/* ============================================================ */}
            {/* Strategy Configuration */}
            {/* ============================================================ */}
            <Card className="overflow-hidden">
                <SectionHeader title="Strategy Configuration" section="strategies" description="Enable/disable strategies and tune parameters" />
                {expandedSections.strategies && (
                    <CardContent className="space-y-6 pt-0">
                        {/* Active Strategies */}
                        <StrategyParamBlock title="Active Strategies">
                            <p className="text-xs text-muted-foreground">Strategies that generate trade signals</p>
                            <CheckboxGroup
                                items={ALL_STRATEGIES}
                                checked={config?.active_strategies}
                                onChange={(v) => handleInputChange('active_strategies', v)}
                            />
                        </StrategyParamBlock>

                        {/* Filter Strategies */}
                        <StrategyParamBlock title="Filter Strategies">
                            <p className="text-xs text-muted-foreground">Strategies used to filter/confirm signals from active strategies</p>
                            <CheckboxGroup
                                items={FILTER_STRATEGIES}
                                checked={config?.filter_strategies}
                                onChange={(v) => handleInputChange('filter_strategies', v)}
                            />
                        </StrategyParamBlock>

                        {/* Consensus Threshold */}
                        <StrategyParamBlock title="Consensus Threshold">
                            <InputField
                                label="Default Low Vol"
                                value={config?.consensus_threshold?.default?.low_vol}
                                onChange={(v) => handleInputChange('consensus_threshold.default.low_vol', v)}
                                type="number" step="0.05" min="0" max="1"
                            />
                            <InputField
                                label="Default High Vol"
                                value={config?.consensus_threshold?.default?.high_vol}
                                onChange={(v) => handleInputChange('consensus_threshold.default.high_vol', v)}
                                type="number" step="0.05" min="0" max="1"
                            />
                            <InputField
                                label="Default Vol Split"
                                value={config?.consensus_threshold?.default?.vol_split}
                                onChange={(v) => handleInputChange('consensus_threshold.default.vol_split', v)}
                                type="number" step="0.001" min="0" max="0.1"
                            />
                        </StrategyParamBlock>

                        {/* FVG Pullback */}
                        <StrategyParamBlock title="FVG Pullback Settings">
                            <InputField
                                label="EMA Period"
                                value={config?.fvg_pullback_params?.ema_period}
                                onChange={(v) => handleInputChange('fvg_pullback_params.ema_period', v)}
                                type="number" min="10" max="200"
                            />
                            <InputField
                                label="Min FVG Size %"
                                value={config?.fvg_pullback_params?.min_fvg_size_percent}
                                onChange={(v) => handleInputChange('fvg_pullback_params.min_fvg_size_percent', v)}
                                type="number" step="0.01" min="0.01"
                            />
                            <InputField
                                label="R:R Ratio"
                                value={config?.fvg_pullback_params?.rr_ratio}
                                onChange={(v) => handleInputChange('fvg_pullback_params.rr_ratio', v)}
                                type="number" step="0.5" min="1" max="10"
                            />
                            <InputField
                                label="Risk Per Trade"
                                value={config?.fvg_pullback_params?.risk_per_trade}
                                onChange={(v) => handleInputChange('fvg_pullback_params.risk_per_trade', v)}
                                type="number" step="0.001" min="0.001" max="0.1"
                            />
                            <InputField
                                label="FVG Lookback"
                                value={config?.fvg_pullback_params?.fvg_lookback}
                                onChange={(v) => handleInputChange('fvg_pullback_params.fvg_lookback', v)}
                                type="number" min="5" max="100"
                            />
                            <InputField
                                label="Max FVG Age"
                                value={config?.fvg_pullback_params?.max_fvg_age}
                                onChange={(v) => handleInputChange('fvg_pullback_params.max_fvg_age', v)}
                                type="number" min="5" max="200"
                            />
                        </StrategyParamBlock>

                        {/* Trendline Breakout */}
                        <StrategyParamBlock title="Trendline Breakout Settings">
                            <InputField
                                label="Swing Lookback"
                                value={config?.trendline_breakout_params?.swing_lookback}
                                onChange={(v) => handleInputChange('trendline_breakout_params.swing_lookback', v)}
                                type="number" min="3" max="50"
                            />
                            <InputField
                                label="Min Swing Points"
                                value={config?.trendline_breakout_params?.min_swing_points}
                                onChange={(v) => handleInputChange('trendline_breakout_params.min_swing_points', v)}
                                type="number" min="2" max="20"
                            />
                            <InputField
                                label="R:R Ratio"
                                value={config?.trendline_breakout_params?.rr_ratio}
                                onChange={(v) => handleInputChange('trendline_breakout_params.rr_ratio', v)}
                                type="number" step="0.5" min="1" max="10"
                            />
                            <InputField
                                label="Risk Per Trade"
                                value={config?.trendline_breakout_params?.risk_per_trade}
                                onChange={(v) => handleInputChange('trendline_breakout_params.risk_per_trade', v)}
                                type="number" step="0.001" min="0.001" max="0.1"
                            />
                            <InputField
                                label="Trendline Lookback"
                                value={config?.trendline_breakout_params?.trendline_lookback}
                                onChange={(v) => handleInputChange('trendline_breakout_params.trendline_lookback', v)}
                                type="number" min="20" max="500"
                            />
                            <InputField
                                label="Breakout Threshold"
                                value={config?.trendline_breakout_params?.breakout_threshold}
                                onChange={(v) => handleInputChange('trendline_breakout_params.breakout_threshold', v)}
                                type="number" step="0.001" min="0"
                            />
                            <InputField
                                label="Pullback Tolerance"
                                value={config?.trendline_breakout_params?.pullback_tolerance}
                                onChange={(v) => handleInputChange('trendline_breakout_params.pullback_tolerance', v)}
                                type="number" step="0.001" min="0"
                            />
                        </StrategyParamBlock>

                        {/* SMC Strategy */}
                        <StrategyParamBlock title="SMC Settings">
                            <InputField
                                label="Swing Lookback"
                                value={config?.smc_swing_lookback}
                                onChange={(v) => handleInputChange('smc_swing_lookback', v)}
                                type="number" min="5" max="100"
                            />
                            <InputField
                                label="FVG Threshold"
                                value={config?.smc_fvg_threshold}
                                onChange={(v) => handleInputChange('smc_fvg_threshold', v)}
                                type="number" step="0.0001"
                            />
                            <InputField
                                label="Liquidity Tolerance"
                                value={config?.smc_liquidity_tolerance}
                                onChange={(v) => handleInputChange('smc_liquidity_tolerance', v)}
                                type="number" step="0.0001"
                            />
                            <SelectField
                                label="Higher Timeframe"
                                value={config?.smc_higher_timeframe}
                                onChange={(v) => handleInputChange('smc_higher_timeframe', v)}
                                options={[
                                    { value: 'M15', label: 'M15' },
                                    { value: 'M30', label: 'M30' },
                                    { value: 'H1', label: 'H1' },
                                    { value: 'H4', label: 'H4' },
                                    { value: 'D1', label: 'D1' }
                                ]}
                            />
                            <InputField
                                label="POI Search Range"
                                value={config?.smc_poi_search_range}
                                onChange={(v) => handleInputChange('smc_poi_search_range', v)}
                                type="number" min="1" max="20"
                            />
                            <InputField
                                label="Risk:Reward Ratio"
                                value={config?.smc_risk_reward_ratio}
                                onChange={(v) => handleInputChange('smc_risk_reward_ratio', v)}
                                type="number" step="0.5" min="1" max="10"
                            />
                            <InputField
                                label="SL Buffer %"
                                value={config?.smc_sl_buffer_pct}
                                onChange={(v) => handleInputChange('smc_sl_buffer_pct', v)}
                                type="number" step="0.1" min="0"
                            />
                            <InputField
                                label="Max SL ATR Multiplier"
                                value={config?.smc_max_sl_atr_multiplier}
                                onChange={(v) => handleInputChange('smc_max_sl_atr_multiplier', v)}
                                type="number" step="0.5" min="0.5" max="10"
                            />
                            <SwitchField
                                label="Enable BOS Trades"
                                checked={config?.smc_enable_bos_trades}
                                onChange={(v) => handleInputChange('smc_enable_bos_trades', v)}
                            />
                            <InputField
                                label="Trade Cooldown"
                                value={config?.smc_trade_cooldown}
                                onChange={(v) => handleInputChange('smc_trade_cooldown', v)}
                                type="number" min="0" suffix="bars"
                            />
                        </StrategyParamBlock>

                        {/* Liquidity Sweep */}
                        <StrategyParamBlock title="Liquidity Sweep Settings">
                            <InputField
                                label="Lookback Period"
                                value={config?.liquidity_sweep_params?.lookback_period}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.lookback_period', v)}
                                type="number" min="5" max="500"
                            />
                            <InputField
                                label="Swing Lookback"
                                value={config?.liquidity_sweep_params?.swing_lookback}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.swing_lookback', v)}
                                type="number" min="3" max="50"
                            />
                            <InputField
                                label="Min Swing Age"
                                value={config?.liquidity_sweep_params?.min_swing_age}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.min_swing_age', v)}
                                type="number" min="1" max="100"
                            />
                            <InputField
                                label="EQ Level Tolerance"
                                value={config?.liquidity_sweep_params?.eq_level_tolerance}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.eq_level_tolerance', v)}
                                type="number" step="0.0001"
                            />
                            <InputField
                                label="OB Retrace %"
                                value={config?.liquidity_sweep_params?.ob_retrace_pct}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.ob_retrace_pct', v)}
                                type="number" step="0.1" min="0" max="1"
                            />
                            <InputField
                                label="Volume Multiplier"
                                value={config?.liquidity_sweep_params?.volume_multiplier}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.volume_multiplier', v)}
                                type="number" step="0.1" min="0.1"
                            />
                            <SwitchField
                                label="Enable FVG"
                                checked={config?.liquidity_sweep_params?.enable_fvg}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.enable_fvg', v)}
                            />
                            <SwitchField
                                label="Enable MSS Confirmation"
                                checked={config?.liquidity_sweep_params?.enable_mss_confirmation}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.enable_mss_confirmation', v)}
                            />
                            <SwitchField
                                label="Enable Inducement Mode"
                                checked={config?.liquidity_sweep_params?.enable_inducement_mode}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.enable_inducement_mode', v)}
                            />
                            <InputField
                                label="Min Inducement Dist (ATR)"
                                value={config?.liquidity_sweep_params?.min_inducement_dist_atr}
                                onChange={(v) => handleInputChange('liquidity_sweep_params.min_inducement_dist_atr', v)}
                                type="number" step="0.1" min="0"
                            />
                        </StrategyParamBlock>

                        {/* Institutional Scalping */}
                        <StrategyParamBlock title="Institutional Scalping Settings">
                            <InputField
                                label="Min R:R Ratio"
                                value={config?.institutional_params?.min_rr_ratio}
                                onChange={(v) => handleInputChange('institutional_params.min_rr_ratio', v)}
                                type="number" step="0.5" min="1" max="10"
                            />
                            <InputField
                                label="OB Lookback"
                                value={config?.institutional_params?.ob_lookback}
                                onChange={(v) => handleInputChange('institutional_params.ob_lookback', v)}
                                type="number" min="5" max="200"
                            />
                            <InputField
                                label="Volume Spike Multiplier"
                                value={config?.institutional_params?.volume_spike_multiplier}
                                onChange={(v) => handleInputChange('institutional_params.volume_spike_multiplier', v)}
                                type="number" step="0.1" min="1"
                            />
                        </StrategyParamBlock>

                        {/* Volume Reversal */}
                        <StrategyParamBlock title="Volume Reversal Settings">
                            <InputField
                                label="VO Fast"
                                value={config?.volume_reversal_params?.vo_fast}
                                onChange={(v) => handleInputChange('volume_reversal_params.vo_fast', v)}
                                type="number" min="1" max="50"
                            />
                            <InputField
                                label="VO Slow"
                                value={config?.volume_reversal_params?.vo_slow}
                                onChange={(v) => handleInputChange('volume_reversal_params.vo_slow', v)}
                                type="number" min="1" max="100"
                            />
                            <InputField
                                label="Spike Threshold"
                                value={config?.volume_reversal_params?.spike_threshold}
                                onChange={(v) => handleInputChange('volume_reversal_params.spike_threshold', v)}
                                type="number" min="1" max="100"
                            />
                            <InputField
                                label="R:R Ratio"
                                value={config?.volume_reversal_params?.rr_ratio}
                                onChange={(v) => handleInputChange('volume_reversal_params.rr_ratio', v)}
                                type="number" step="0.5" min="1" max="10"
                            />
                            <InputField
                                label="Risk Per Trade"
                                value={config?.volume_reversal_params?.risk_per_trade}
                                onChange={(v) => handleInputChange('volume_reversal_params.risk_per_trade', v)}
                                type="number" step="0.001" min="0.001" max="0.1"
                            />
                            <InputField
                                label="Lookback for Spike"
                                value={config?.volume_reversal_params?.lookback_for_spike}
                                onChange={(v) => handleInputChange('volume_reversal_params.lookback_for_spike', v)}
                                type="number" min="1" max="50"
                            />
                        </StrategyParamBlock>

                        {/* Fibonacci */}
                        <StrategyParamBlock title="Fibonacci Settings">
                            <InputField
                                label="Swing Lookback"
                                value={config?.fibonacci_golden_zone?.swing_lookback}
                                onChange={(v) => handleInputChange('fibonacci_golden_zone.swing_lookback', v)}
                                type="number" min="10" max="200"
                            />
                            <InputField
                                label="Trend EMA Period"
                                value={config?.fibonacci_golden_zone?.trend_ema_period}
                                onChange={(v) => handleInputChange('fibonacci_golden_zone.trend_ema_period', v)}
                                type="number" min="10" max="200"
                            />
                            <InputField
                                label="Signal Strength"
                                value={config?.fibonacci_golden_zone?.signal_strength}
                                onChange={(v) => handleInputChange('fibonacci_golden_zone.signal_strength', v)}
                                type="number" step="0.05" min="0.1" max="1"
                            />
                            <SwitchField
                                label="Dynamic Entry"
                                checked={config?.fibonacci_golden_zone?.dynamic_entry_enabled}
                                onChange={(v) => handleInputChange('fibonacci_golden_zone.dynamic_entry_enabled', v)}
                            />
                            <InputField
                                label="Max Entry Distance (ATR)"
                                value={config?.fibonacci_golden_zone?.max_entry_distance_atr}
                                onChange={(v) => handleInputChange('fibonacci_golden_zone.max_entry_distance_atr', v)}
                                type="number" step="0.1" min="0.1" max="3"
                            />
                            <InputField
                                label="SL Level"
                                value={config?.fibonacci_golden_zone?.sl_level}
                                onChange={(v) => handleInputChange('fibonacci_golden_zone.sl_level', v)}
                                type="number" step="0.01" min="0" max="2"
                                description="Fibonacci level for stop loss (e.g. 0.786)"
                            />
                            <InputField
                                label="TP Extension"
                                value={config?.fibonacci_golden_zone?.tp_extension}
                                onChange={(v) => handleInputChange('fibonacci_golden_zone.tp_extension', v)}
                                type="number" step="0.01" min="0" max="3"
                                description="Fibonacci extension for take profit"
                            />
                            <SwitchField
                                label="Candlestick Confirmation"
                                checked={config?.fibonacci_golden_zone?.enable_candlestick_confirm}
                                onChange={(v) => handleInputChange('fibonacci_golden_zone.enable_candlestick_confirm', v)}
                            />
                        </StrategyParamBlock>

                        {/* ADX Filter */}
                        <StrategyParamBlock title="ADX Filter Settings">
                            <SwitchField
                                label="Enable ADX Filter"
                                checked={config?.adx_signal_filter?.enabled}
                                onChange={(v) => handleInputChange('adx_signal_filter.enabled', v)}
                            />
                            <InputField
                                label="ADX Period"
                                value={config?.adx_period}
                                onChange={(v) => handleInputChange('adx_period', v)}
                                type="number" min="5" max="50"
                            />
                            <InputField
                                label="ADX DI Period"
                                value={config?.adx_di_period}
                                onChange={(v) => handleInputChange('adx_di_period', v)}
                                type="number" min="5" max="50"
                            />
                            <InputField
                                label="ADX Threshold"
                                value={config?.adx_threshold}
                                onChange={(v) => handleInputChange('adx_threshold', v)}
                                type="number" min="10" max="50"
                            />
                            <InputField
                                label="Min ADX for Entry"
                                value={config?.adx_signal_filter?.min_adx_for_entry}
                                onChange={(v) => handleInputChange('adx_signal_filter.min_adx_for_entry', v)}
                                type="number" min="5" max="50"
                            />
                            <InputField
                                label="ADX Strength Factor"
                                value={config?.adx_strength_factor}
                                onChange={(v) => handleInputChange('adx_strength_factor', v)}
                                type="number" step="0.01" min="0"
                            />
                            <SwitchField
                                label="Require DI Confirmation"
                                checked={config?.adx_signal_filter?.require_di_confirmation}
                                onChange={(v) => handleInputChange('adx_signal_filter.require_di_confirmation', v)}
                            />
                            <SelectField
                                label="Filter Mode"
                                value={config?.adx_signal_filter?.filter_mode}
                                onChange={(v) => handleInputChange('adx_signal_filter.filter_mode', v)}
                                options={[
                                    { value: 'all_others', label: 'All Other Strategies' },
                                    { value: 'selected', label: 'Selected Strategies Only' }
                                ]}
                            />
                        </StrategyParamBlock>
                    </CardContent>
                )}
            </Card>

            {/* ============================================================ */}
            {/* Trading Sessions */}
            {/* ============================================================ */}
            <Card className="overflow-hidden">
                <SectionHeader title="Trading Sessions" section="tradingSessions" description="Session times, trading hours, and symbol assignments" />
                {expandedSections.tradingSessions && (
                    <CardContent className="space-y-4 pt-0">
                        <SwitchField
                            label="Enable Session Filter"
                            checked={config?.trading_sessions?.enabled}
                            onChange={(v) => handleInputChange('trading_sessions.enabled', v)}
                            description="Only trade during specified sessions"
                        />

                        <SubHeader title="Session Times (UTC)" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['asian', 'london', 'ny'].map(session => (
                                <div key={session} className="border border-border/30 rounded-lg p-3 space-y-2">
                                    <h5 className="font-medium capitalize">{session === 'ny' ? 'New York' : session}</h5>
                                    <div className="flex gap-2 text-sm items-center">
                                        <input
                                            type="time"
                                            value={config?.trading_sessions?.sessions?.[session]?.start ?? '00:00'}
                                            onChange={(e) => handleInputChange(`trading_sessions.sessions.${session}.start`, e.target.value)}
                                            className="flex-1 px-2 py-1 bg-background border border-input rounded text-xs"
                                        />
                                        <span className="text-muted-foreground">to</span>
                                        <input
                                            type="time"
                                            value={config?.trading_sessions?.sessions?.[session]?.end ?? '00:00'}
                                            onChange={(e) => handleInputChange(`trading_sessions.sessions.${session}.end`, e.target.value)}
                                            className="flex-1 px-2 py-1 bg-background border border-input rounded text-xs"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Symbol-Session Mapping */}
                        <SubHeader title="Symbol Session Assignments" />
                        <p className="text-xs text-muted-foreground -mt-2">Which sessions each symbol is allowed to trade in</p>
                        {(config?.symbols ?? []).map(symbol => (
                            <div key={symbol} className="border border-border/30 rounded-lg p-3 space-y-2">
                                <h5 className="font-medium text-sm">{symbol}</h5>
                                <div className="flex gap-4">
                                    {['asian', 'london', 'ny'].map(session => (
                                        <label key={session} className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config?.trading_sessions?.symbols?.[symbol]?.includes(session) ?? false}
                                                onChange={(e) => {
                                                    const current = config?.trading_sessions?.symbols?.[symbol] ?? [];
                                                    const updated = e.target.checked
                                                        ? [...current, session]
                                                        : current.filter(s => s !== session);
                                                    handleInputChange(`trading_sessions.symbols.${symbol}`, updated);
                                                }}
                                                className="w-3.5 h-3.5 rounded border-input"
                                            />
                                            <span className="text-xs capitalize">{session === 'ny' ? 'New York' : session}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Trading Hours per Symbol */}
                        <SubHeader title="Trading Hours Per Symbol" />
                        <p className="text-xs text-muted-foreground -mt-2">Allowed trading days and hours for each symbol</p>
                        {(config?.symbols ?? []).map(symbol => (
                            <div key={symbol} className="border border-border/30 rounded-lg p-3 space-y-3">
                                <h5 className="font-medium text-sm">{symbol}</h5>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <label key={day} className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config?.trading_hours?.[symbol]?.days?.includes(day) ?? false}
                                                onChange={(e) => {
                                                    const current = config?.trading_hours?.[symbol]?.days ?? [];
                                                    const updated = e.target.checked
                                                        ? [...current, day]
                                                        : current.filter(d => d !== day);
                                                    handleInputChange(`trading_hours.${symbol}.days`, updated);
                                                }}
                                                className="w-3.5 h-3.5 rounded border-input"
                                            />
                                            <span className="text-xs">{day.slice(0, 3)}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center text-sm">
                                    <input
                                        type="time"
                                        value={config?.trading_hours?.[symbol]?.start ?? '00:00'}
                                        onChange={(e) => handleInputChange(`trading_hours.${symbol}.start`, e.target.value)}
                                        className="px-2 py-1 bg-background border border-input rounded text-xs"
                                    />
                                    <span className="text-muted-foreground text-xs">to</span>
                                    <input
                                        type="time"
                                        value={config?.trading_hours?.[symbol]?.end ?? '23:59'}
                                        onChange={(e) => handleInputChange(`trading_hours.${symbol}.end`, e.target.value)}
                                        className="px-2 py-1 bg-background border border-input rounded text-xs"
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                )}
            </Card>

            {/* ============================================================ */}
            {/* Advanced Trade Management */}
            {/* ============================================================ */}
            <Card className="overflow-hidden">
                <SectionHeader title="Trade Management" section="tradeManagement" description="Profit securing, trailing stop, and time-based exits" />
                {expandedSections.tradeManagement && (
                    <CardContent className="space-y-6 pt-0">
                        {/* Profit Securing / Trailing Stop */}
                        <StrategyParamBlock title="Profit Securing & Trailing Stop">
                            <SwitchField
                                label="Enable Profit Securing"
                                checked={config?.profit_securing_stop_loss?.enabled}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.enabled', v)}
                                description="Move SL to breakeven or profit after price moves favorably"
                            />
                            <SubHeader title="Default Settings" />
                            <InputField
                                label="Trigger Profit (pips)"
                                value={config?.profit_securing_stop_loss?.default?.trigger_profit_pips}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.trigger_profit_pips', v)}
                                type="number" min="1"
                                description="Pips in profit before securing kicks in"
                            />
                            <SelectField
                                label="Secure Profit Type"
                                value={config?.profit_securing_stop_loss?.default?.secure_profit_type}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.secure_profit_type', v)}
                                options={[
                                    { value: 'fixed_pips', label: 'Fixed Pips' },
                                    { value: 'percentage_of_profit', label: '% of Profit' }
                                ]}
                            />
                            <InputField
                                label="Secure Profit Fixed Pips"
                                value={config?.profit_securing_stop_loss?.default?.secure_profit_fixed_pips}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.secure_profit_fixed_pips', v)}
                                type="number" min="0"
                            />
                            <InputField
                                label="Secure Profit %"
                                value={config?.profit_securing_stop_loss?.default?.secure_profit_percentage}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.secure_profit_percentage', v)}
                                type="number" step="0.1" min="0" max="1"
                            />
                            <SwitchField
                                label="Trailing Active"
                                checked={config?.profit_securing_stop_loss?.default?.trailing_active}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.trailing_active', v)}
                            />
                            <SelectField
                                label="Trailing Method"
                                value={config?.profit_securing_stop_loss?.default?.trailing_method}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.trailing_method', v)}
                                options={[
                                    { value: 'atr_multiplier', label: 'ATR Multiplier' },
                                    { value: 'fixed_pips_behind', label: 'Fixed Pips Behind' },
                                    { value: 'percentage_of_peak_profit', label: '% of Peak Profit' }
                                ]}
                            />
                            <InputField
                                label="Trailing ATR Period"
                                value={config?.profit_securing_stop_loss?.default?.trailing_atr_period}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.trailing_atr_period', v)}
                                type="number" min="5" max="50"
                            />
                            <InputField
                                label="Trailing ATR Multiplier"
                                value={config?.profit_securing_stop_loss?.default?.trailing_atr_multiplier}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.trailing_atr_multiplier', v)}
                                type="number" step="0.1" min="0.5" max="5"
                            />
                            <InputField
                                label="Trailing Fixed Pips Behind"
                                value={config?.profit_securing_stop_loss?.default?.trailing_fixed_pips_behind}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.trailing_fixed_pips_behind', v)}
                                type="number" min="1"
                            />
                            <InputField
                                label="Trailing % of Peak Profit"
                                value={config?.profit_securing_stop_loss?.default?.trailing_percentage_of_peak_profit}
                                onChange={(v) => handleInputChange('profit_securing_stop_loss.default.trailing_percentage_of_peak_profit', v)}
                                type="number" step="0.05" min="0" max="1"
                            />
                        </StrategyParamBlock>

                        {/* Time-based Exit */}
                        <StrategyParamBlock title="Time-Based Exit">
                            <SwitchField
                                label="Enable Time-Based Exit"
                                checked={config?.time_based_exit?.enabled}
                                onChange={(v) => handleInputChange('time_based_exit.enabled', v)}
                                description="Close trades after max bars or on momentum fade"
                            />
                            <TagInput
                                label="Apply to Timeframes"
                                value={config?.time_based_exit?.apply_to_timeframes}
                                onChange={(v) => handleArrayChange('time_based_exit.apply_to_timeframes', v)}
                                placeholder="M1, M5, M15"
                            />
                            <SubHeader title="Default Parameters" />
                            <InputField
                                label="Max Bars Open"
                                value={config?.time_based_exit?.default?.max_bars_open}
                                onChange={(v) => handleInputChange('time_based_exit.default.max_bars_open', v)}
                                type="number" min="1" max="100"
                            />
                            <InputField
                                label="Min Profit Pips to Consider"
                                value={config?.time_based_exit?.default?.min_profit_pips_to_consider}
                                onChange={(v) => handleInputChange('time_based_exit.default.min_profit_pips_to_consider', v)}
                                type="number" min="0"
                            />
                            <InputField
                                label="Momentum Fade ADX Threshold"
                                value={config?.time_based_exit?.default?.momentum_fade_adx_threshold}
                                onChange={(v) => handleInputChange('time_based_exit.default.momentum_fade_adx_threshold', v)}
                                type="number" min="5" max="50"
                            />
                        </StrategyParamBlock>

                        {/* Auto-close Profit Take */}
                        <StrategyParamBlock title="Auto-Close Short TF Profit Take">
                            <SwitchField
                                label="Enable Auto-Close Profit"
                                checked={config?.auto_close_short_tf_profit_take?.enabled}
                                onChange={(v) => handleInputChange('auto_close_short_tf_profit_take.enabled', v)}
                            />
                            <InputField
                                label="TP Distance Ratio"
                                value={config?.auto_close_short_tf_profit_take?.tp_distance_ratio}
                                onChange={(v) => handleInputChange('auto_close_short_tf_profit_take.tp_distance_ratio', v)}
                                type="number" step="0.1" min="0" max="1"
                            />
                            <InputField
                                label="Trend EMA Short"
                                value={config?.auto_close_short_tf_profit_take?.trend_ema_short}
                                onChange={(v) => handleInputChange('auto_close_short_tf_profit_take.trend_ema_short', v)}
                                type="number" min="3" max="50"
                            />
                            <InputField
                                label="Trend EMA Long"
                                value={config?.auto_close_short_tf_profit_take?.trend_ema_long}
                                onChange={(v) => handleInputChange('auto_close_short_tf_profit_take.trend_ema_long', v)}
                                type="number" min="10" max="100"
                            />
                            <InputField
                                label="Trend SMA Period"
                                value={config?.auto_close_short_tf_profit_take?.trend_sma_period}
                                onChange={(v) => handleInputChange('auto_close_short_tf_profit_take.trend_sma_period', v)}
                                type="number" min="5" max="100"
                            />
                        </StrategyParamBlock>

                        {/* Auto-close Stop Loss */}
                        <StrategyParamBlock title="Auto-Close Short TF Stop Loss">
                            <SwitchField
                                label="Enable Auto-Close SL"
                                checked={config?.auto_close_short_tf_stop_loss?.enabled}
                                onChange={(v) => handleInputChange('auto_close_short_tf_stop_loss.enabled', v)}
                            />
                            <InputField
                                label="SL Distance Ratio"
                                value={config?.auto_close_short_tf_stop_loss?.sl_distance_ratio}
                                onChange={(v) => handleInputChange('auto_close_short_tf_stop_loss.sl_distance_ratio', v)}
                                type="number" step="0.1" min="0" max="1"
                            />
                        </StrategyParamBlock>
                    </CardContent>
                )}
            </Card>

            {/* ============================================================ */}
            {/* Action Buttons */}
            {/* ============================================================ */}
            <Card className="bg-card/50 backdrop-blur-sm border-muted/40">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                            Last saved: {lastSaved}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleReset}
                                disabled={!hasChanges}
                                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${hasChanges
                                    ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                                    : 'bg-secondary/50 text-secondary-foreground/50 cursor-not-allowed'
                                    }`}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" /> Discard Changes
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges || saving}
                                className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-all ${hasChanges && !saving
                                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_-3px_rgba(59,130,246,0.6)]'
                                    : 'bg-primary/50 text-primary-foreground/50 cursor-not-allowed'
                                    }`}
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
