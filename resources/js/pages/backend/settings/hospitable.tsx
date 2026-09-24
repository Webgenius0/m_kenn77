import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";

interface Props {
    api_key: string;
    base_url: string;
    is_connected: boolean;
    message?: string | null;
    properties_count: number;
}

export default function HospitableSettings({
    api_key,
    base_url,
    is_connected,
    message,
    properties_count,
}: Props) {
    const DEFAULT_URL = "https://public.api.hospitable.com/v2";
    const [showKey, setShowKey] = useState(false);
    const { data, setData, processing } = useForm({
        api_key: api_key || "",
        base_url: base_url || DEFAULT_URL,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post("/admin/settings/hospitable/update", data);
    };

    return (
        <>
            <Head title="Hospitable Settings" />
            <div className="card bg-white border border-white rounded-10 p-20 mb-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-20">
                    <div>
                        <h3 className="mb-1 fs-22">Hospitable API Settings</h3>
                        <p className="fs-15 text-muted mb-0">
                            Connect your Hospitable (Smartbnb) account to synchronize properties, availability, and reservations.
                        </p>
                    </div>

                    <div>
                        {is_connected ? (
                            <span className="badge bg-success bg-opacity-10 text-success fs-14 py-2 px-3 rounded-pill d-inline-flex align-items-center gap-1">
                                <span className="p-1 bg-success rounded-circle d-inline-block"></span>
                                Connected &middot; {properties_count} Properties Found
                            </span>
                        ) : (
                            <span className="badge bg-warning bg-opacity-10 text-warning fs-14 py-2 px-3 rounded-pill d-inline-flex align-items-center gap-1">
                                <span className="p-1 bg-warning rounded-circle d-inline-block"></span>
                                {data.api_key ? "Connection Error" : "Not Configured"}
                            </span>
                        )}
                    </div>
                </div>

                {message && (
                    <div className={`alert ${is_connected ? "alert-info" : "alert-warning"} d-flex align-items-center mb-4`} role="alert">
                        <i className="material-symbols-outlined me-2 fs-20">
                            {is_connected ? "info" : "warning"}
                        </i>
                        <div>{message}</div>
                    </div>
                )}

                <div className="p-3 bg-light rounded-10 mb-4">
                    <h6 className="fw-semibold mb-2 fs-15">How to get your Hospitable Personal Access Token (PAT):</h6>
                    <ol className="mb-0 ps-3 text-muted fs-14">
                        <li className="mb-1">Log in to your dashboard at <a href="https://my.hospitable.com" target="_blank" rel="noreferrer" className="text-primary text-decoration-underline">my.hospitable.com</a></li>
                        <li className="mb-1">Navigate to <strong>Apps</strong> or <strong>Settings &gt; Integrations &gt; API access</strong></li>
                        <li className="mb-1">Click <strong>+ Add new</strong> in the Access tokens tab, ensure <code>Read</code> permissions are granted</li>
                        <li>Copy the generated token and paste it into the API Key field below</li>
                    </ol>
                </div>

                <form onSubmit={submit} style={{ minHeight: "40vh" }}>
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="mb-20">
                                <label className="label fs-16 mb-2">Hospitable API Key / Bearer Token</label>
                                <div className="input-group">
                                    <input
                                        type={showKey ? "text" : "password"}
                                        className="form-control"
                                        id="api_key"
                                        placeholder="Enter your Hospitable Personal Access Token"
                                        value={data.api_key}
                                        onChange={(e) => setData("api_key", e.target.value)}
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowKey(!showKey)}
                                        title={showKey ? "Hide Token" : "Show Token"}
                                    >
                                        <i className="material-symbols-outlined fs-18">
                                            {showKey ? "visibility_off" : "visibility"}
                                        </i>
                                    </button>
                                </div>
                                <div className="form-text text-muted">
                                    Can also be configured via <code>HOSPITABLE_API_KEY</code> in your <code>.env</code> file.
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-8">
                            <div className="mb-20">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="label fs-16 mb-0">Hospitable API Base URL</label>
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 fs-12 text-muted"
                                        onClick={() => setData("base_url", DEFAULT_URL)}
                                    >
                                        Reset to default
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="base_url"
                                    placeholder="https://public.api.hospitable.com/v2"
                                    value={data.base_url}
                                    onChange={(e) => setData("base_url", e.target.value)}
                                />
                                <div className="form-text text-muted">
                                    Default is <code>https://public.api.hospitable.com/v2</code>.
                                </div>
                            </div>
                        </div>

                        <div className="col-12 mt-3">
                            <button
                                type="submit"
                                className="btn btn-primary text-white px-4"
                                disabled={processing}
                            >
                                {processing ? "Saving..." : "Save Settings"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
