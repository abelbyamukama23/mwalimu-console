"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Network,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Play,
  Key,
  Database,
  X,
  History,
} from "lucide-react";
import { useInstitution } from "../../../lib/institution/institution-context";
import { api } from "../../../lib/api/client";
import {
  InstitutionConnection,
  ConnectorSummary,
  Library,
  ConnectionSyncJob,
} from "../../../types";

export default function ConnectorsPage() {
  const { activeInstitution } = useInstitution();
  const [connections, setConnections] = useState<InstitutionConnection[]>([]);
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedConnectionJobs, setSelectedConnectionJobs] = useState<{
    connection: InstitutionConnection;
    jobs: ConnectionSyncJob[];
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formLibraryId, setFormLibraryId] = useState("");
  const [formConnectorId, setFormConnectorId] = useState("");
  const [formName, setFormName] = useState("");
  const [formFrequency, setFormFrequency] = useState("daily");
  const [formCredentials, setFormCredentials] = useState("");

  const fetchData = async () => {
    if (!activeInstitution?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [connList, connectorList, libList] = await Promise.all([
        api.institutions.getConnections(activeInstitution.id),
        api.connectors.list(),
        api.libraries.list({ institution_id: activeInstitution.id }),
      ]);
      setConnections(connList || []);
      setConnectors(connectorList || []);
      setLibraries(libList.results || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load connectors and connections.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeInstitution?.id]);

  const handleTriggerSync = async (connection: InstitutionConnection) => {
    setSyncingId(connection.id);
    setError(null);
    try {
      await api.connectors.triggerSync(connection.library_id, connection.id);
      setSuccessMessage(`Sync queued for ${connection.name}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to trigger sync job.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleViewSyncJobs = async (connection: InstitutionConnection) => {
    try {
      const jobs = await api.connectors.listSyncJobs(
        connection.library_id,
        connection.id
      );
      setSelectedConnectionJobs({ connection, jobs: jobs || [] });
    } catch (err: any) {
      setError(err?.message || "Failed to load historical sync jobs.");
    }
  };

  const handleDeleteConnection = async (connection: InstitutionConnection) => {
    if (
      !confirm(
        `Are you sure you want to delete "${connection.name}"? Historical resources will remain in the library.`
      )
    ) {
      return;
    }
    try {
      await api.connectors.deleteConnection(connection.library_id, connection.id);
      setSuccessMessage(`Connection "${connection.name}" removed.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete connection.");
    }
  };

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLibraryId || !formConnectorId || !formName.trim()) {
      setError("Please fill in library, connector type, and connection name.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    let parsedCreds: Record<string, any> | undefined = undefined;
    if (formCredentials.trim()) {
      try {
        parsedCreds = JSON.parse(formCredentials);
      } catch (e) {
        setError("Credentials must be valid JSON format.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await api.connectors.createConnection(formLibraryId, {
        connector_id: formConnectorId,
        name: formName.trim(),
        sync_frequency: formFrequency,
        credentials: parsedCreds,
      });
      setIsModalOpen(false);
      setFormName("");
      setFormCredentials("");
      setSuccessMessage("New connection attached successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to attach connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = connections.filter((c) => c.status === "active").length;
  const distinctLibs = new Set(connections.map((c) => c.library_id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Workspaces</span>
          <span>/</span>
          <span>Integrations</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">Knowledge Connectors</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">
              Knowledge Connectors
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
              Synchronize external repositories and institutional documents directly into knowledge libraries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              title="Refresh connections"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : "text-slate-500"} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 shadow-xs transition-colors"
            >
              <Plus size={13} />
              <span>Attach Connection</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-700 flex items-start gap-2">
          <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* KPI Cards (DeepSeek card layout) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Connections
            </span>
            <Network size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : connections.length}
            </span>
            <span className="text-xs text-slate-500 font-normal">Active Sources</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-400">
            Linked to external document providers
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Active Sync Links
            </span>
            <CheckCircle2 size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-emerald-600 tracking-tight">
              {isLoading ? "—" : activeCount}
            </span>
            <span className="text-xs text-slate-500 font-normal">Operational</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-400">
            Continuously ingesting curriculum updates
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Synchronized Libraries
            </span>
            <Database size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : distinctLibs}
            </span>
            <span className="text-xs text-slate-500 font-normal">Libraries</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-400">
            Target institutional knowledge scopes
          </p>
        </div>
      </div>

      {/* Connections Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-slate-50/80">
          <div className="flex items-center gap-1.5">
            <Network size={14} className="text-accent" />
            <span className="text-xs font-semibold text-slate-800">
              Configured External Connections
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {connections.length} connections across {libraries.length} libraries
          </span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-slate-400">
            Loading institutional connections...
          </div>
        ) : connections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-medium">
                <tr>
                  <th className="px-3.5 py-2">Connection Name</th>
                  <th className="px-3.5 py-2">Attached Library</th>
                  <th className="px-3.5 py-2">Connector</th>
                  <th className="px-3.5 py-2">Schedule</th>
                  <th className="px-3.5 py-2">Status</th>
                  <th className="px-3.5 py-2">Last Sync</th>
                  <th className="px-3.5 py-2">Credentials</th>
                  <th className="px-3.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {connections.map((conn) => (
                  <tr key={conn.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-2.5 font-medium text-slate-900">
                      {conn.name}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <Link
                        href={`/libraries`}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <span>{conn.library_name || "Library"}</span>
                        <ExternalLink size={10} className="text-slate-400" />
                      </Link>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600">
                      {conn.connector?.name || "Connector"}
                    </td>
                    <td className="px-3.5 py-2.5 capitalize text-slate-500 font-mono text-[11px]">
                      {conn.sync_frequency}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                          conn.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : conn.status === "error"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {conn.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                      {conn.last_synced_at ? (
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>
                            {new Date(conn.last_synced_at).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        "Never synced"
                      )}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                        <Key size={11} className={conn.has_credentials ? "text-emerald-600" : "text-amber-500"} />
                        <span>{conn.has_credentials ? "Configured" : "Missing"}</span>
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleTriggerSync(conn)}
                          disabled={syncingId === conn.id}
                          title="Trigger sync now"
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition-colors"
                        >
                          <Play size={13} className={syncingId === conn.id ? "animate-spin" : ""} />
                        </button>
                        <button
                          onClick={() => handleViewSyncJobs(conn)}
                          title="View historical sync jobs"
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <History size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteConnection(conn)}
                          title="Delete connection"
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center text-xs text-slate-400">
            <p>No knowledge connections configured yet for this institution.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 text-accent hover:underline font-medium"
            >
              Attach your first connection →
            </button>
          </div>
        )}
      </div>

      {/* Zero Secret Leakage Architectural Callout */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600">
        <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
          <Key size={14} className="text-accent" />
          <span>Server-Side Credential Encryption & Masking</span>
        </div>
        <p className="leading-relaxed">
          Authentication credentials for Google Drive, SharePoint, and remote repositories are stored encrypted at rest inside the authoritative Platform API. Responses expose only the boolean verification flag{" "}
          <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">
            has_credentials: true
          </code>
          . Cleartext access keys and tokens are never transmitted to this console.
        </p>
      </div>

      {/* Attach Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                Attach External Knowledge Connection
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateConnection} className="mt-3.5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Target Knowledge Library *
                </label>
                <select
                  value={formLibraryId}
                  onChange={(e) => setFormLibraryId(e.target.value)}
                  required
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none"
                >
                  <option value="">Select a library</option>
                  {libraries.map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.name} ({lib.visibility})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Connector Provider *
                </label>
                <select
                  value={formConnectorId}
                  onChange={(e) => setFormConnectorId(e.target.value)}
                  required
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none"
                >
                  <option value="">Select connector</option>
                  {connectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.connector_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Connection Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Grade 10 Science Repository"
                  required
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Sync Frequency
                </label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none"
                >
                  <option value="manual">Manual (On-Demand only)</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Optional Credentials (JSON)
                </label>
                <textarea
                  rows={3}
                  value={formCredentials}
                  onChange={(e) => setFormCredentials(e.target.value)}
                  placeholder='{"api_key": "...", "folder_id": "..."}'
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 font-mono text-[11px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Encrypted immediately by the Platform API before storage.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? "Attaching..." : "Save Connection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync Jobs Drawer */}
      {selectedConnectionJobs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Sync History: {selectedConnectionJobs.connection.name}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Execution runs triggered by schedules or administrative requests.
                </p>
              </div>
              <button
                onClick={() => setSelectedConnectionJobs(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3.5 flex-1 overflow-y-auto space-y-2 text-xs">
              {selectedConnectionJobs.jobs.length > 0 ? (
                selectedConnectionJobs.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-slate-100 p-2.5 space-y-1 bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-medium uppercase font-mono border ${
                          job.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : job.status === "failed"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(job.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        Discovered: <strong>{job.resources_discovered}</strong>
                      </div>
                      <div>
                        Created: <strong>{job.resources_created}</strong>
                      </div>
                      <div>
                        Updated: <strong>{job.resources_updated}</strong>
                      </div>
                      <div>
                        Deleted: <strong>{job.resources_deleted}</strong>
                      </div>
                    </div>
                    {job.error_message && (
                      <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded mt-1 border border-rose-100">
                        {job.error_message}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                  No synchronization runs executed yet for this connection.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedConnectionJobs(null)}
                className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
