import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Car, Plus, Trash2, Wrench, Bell, History, ArrowRight,
  CheckCircle2, AlertTriangle, Loader2, ListChecks,
} from "lucide-react";
import {
  listVehicles, createVehicle, deleteVehicle,
  listReminders, createReminder, completeReminder, deleteReminder,
  listHealthLogs, createHealthLog, deleteHealthLog,
  getVehicleHealthScore,
} from "@/lib/garage.functions";

export const Route = createFileRoute("/_authenticated/garage")({
  head: () => ({
    meta: [
      { title: "My Garage — Vehicles, Reminders & Health Record | Manoj Wheels" },
      { name: "description", content: "Track your vehicles, get maintenance reminders by email, and keep a complete service history — Manoj Wheels Garage." },
    ],
  }),
  component: GaragePage,
});

type Vehicle = {
  id: string; nickname: string | null; make: string; model: string;
  year: number | null; registration: string | null; vehicle_type: string;
  current_odometer_km: number; fuel_type: string | null; notes: string | null;
};

type Reminder = {
  id: string; vehicle_id: string; title: string; service_type: string;
  due_date: string | null; due_odometer_km: number | null; status: string;
  notes: string | null;
  vehicles?: { nickname: string | null; make: string; model: string };
};

type HealthLog = {
  id: string; vehicle_id: string; entry_type: string; title: string;
  description: string | null; odometer_km: number | null;
  cost: number | null; service_date: string;
  vehicles?: { nickname: string | null; make: string; model: string };
};

function GaragePage() {
  const _listVehicles = useServerFn(listVehicles);
  const _createVehicle = useServerFn(createVehicle);
  const _deleteVehicle = useServerFn(deleteVehicle);
  const _listReminders = useServerFn(listReminders);
  const _completeReminder = useServerFn(completeReminder);
  const _deleteReminder = useServerFn(deleteReminder);
  const _createReminder = useServerFn(createReminder);
  const _listHealthLogs = useServerFn(listHealthLogs);
  const _createHealthLog = useServerFn(createHealthLog);
  const _deleteHealthLog = useServerFn(deleteHealthLog);
  const _getScore = useServerFn(getVehicleHealthScore);

  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [scores, setScores] = useState<Record<string, { score: number; verdict: string; overdueCount: number }>>({});
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showReminderFor, setShowReminderFor] = useState<string | null>(null);
  const [showLogFor, setShowLogFor] = useState<string | null>(null);

  async function refreshAll() {
    try {
      const [v, r, l] = await Promise.all([_listVehicles(), _listReminders(), _listHealthLogs({ data: {} })]);
      setVehicles(v as Vehicle[]);
      setReminders(r as Reminder[]);
      setLogs(l as HealthLog[]);
      const sc: typeof scores = {};
      await Promise.all((v as Vehicle[]).map(async (veh) => {
        try {
          const s = await _getScore({ data: { vehicleId: veh.id } });
          sc[veh.id] = { score: s.score, verdict: s.verdict, overdueCount: s.overdueCount };
        } catch { /* ignore */ }
      }));
      setScores(sc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load garage");
    }
  }

  useEffect(() => { refreshAll(); /* eslint-disable-next-line */ }, []);

  const today = new Date();
  const overdueReminders = reminders.filter(r => r.status === "pending" && r.due_date && new Date(r.due_date) < today);
  const upcomingReminders = reminders.filter(r => {
    if (r.status !== "pending") return false;
    if (!r.due_date) return true;
    const days = (new Date(r.due_date).getTime() - today.getTime()) / 86400000;
    return days >= 0 && days <= 30;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">My Garage</h1>
          <p className="text-muted-foreground mt-1 text-sm">Vehicles, reminders & health record — all in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/_authenticated/dashboard">Reports</Link></Button>
          <Button variant="hero" onClick={() => setShowVehicleForm(v => !v)}>
            <Plus className="w-4 h-4" /> Add Vehicle
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <Stat label="Vehicles" value={vehicles?.length ?? "—"} icon={<Car className="w-5 h-5 text-primary" />} />
        <Stat label="Overdue Reminders" value={overdueReminders.length} icon={<AlertTriangle className="w-5 h-5 text-primary" />} />
        <Stat label="Due in 30 days" value={upcomingReminders.length} icon={<Bell className="w-5 h-5 text-gold" />} />
      </div>

      {showVehicleForm && (
        <Card className="mt-6 p-5 bg-card/60">
          <VehicleForm
            onSubmit={async (payload) => {
              await _createVehicle({ data: payload });
              toast.success("Vehicle added");
              setShowVehicleForm(false);
              refreshAll();
            }}
            onCancel={() => setShowVehicleForm(false)}
          />
        </Card>
      )}

      <Tabs defaultValue="vehicles" className="mt-8">
        <TabsList>
          <TabsTrigger value="vehicles"><Car className="w-4 h-4 mr-1.5" />Vehicles</TabsTrigger>
          <TabsTrigger value="reminders"><Bell className="w-4 h-4 mr-1.5" />Reminders</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-1.5" />Health Record</TabsTrigger>
        </TabsList>

        {/* VEHICLES */}
        <TabsContent value="vehicles" className="mt-6 space-y-4">
          {vehicles === null ? (
            <div className="grid gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          ) : vehicles.length === 0 ? (
            <Card className="p-10 text-center bg-card/60">
              <Car className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="mt-4 font-bold">No vehicles yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Add your first vehicle to start tracking.</p>
              <Button variant="hero" className="mt-4" onClick={() => setShowVehicleForm(true)}>
                <Plus className="w-4 h-4" /> Add Vehicle
              </Button>
            </Card>
          ) : (
            <ul className="grid gap-3">
              {vehicles.map(v => {
                const s = scores[v.id];
                return (
                  <li key={v.id}>
                    <Card className="p-5 bg-card/60">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-primary/15 border border-primary/30 flex items-center justify-center">
                          <span className="text-xl font-extrabold text-gradient-primary">{s?.score ?? "—"}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold">{v.nickname || `${v.make} ${v.model}`}</h3>
                            <Badge variant="outline" className="text-[10px] uppercase">{v.vehicle_type}</Badge>
                            {v.registration && <Badge variant="outline" className="text-[10px]">{v.registration}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {v.make} {v.model} {v.year ? `· ${v.year}` : ""} · {v.current_odometer_km.toLocaleString()} km
                            {s ? ` · ${s.verdict}` : ""}
                          </p>
                          {s && s.overdueCount > 0 && (
                            <p className="text-xs text-primary mt-1 font-medium">
                              <AlertTriangle className="inline w-3 h-3 mr-1" />
                              {s.overdueCount} overdue reminder{s.overdueCount > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setShowReminderFor(v.id)}>
                            <Bell className="w-4 h-4" /> Add Reminder
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowLogFor(v.id)}>
                            <Wrench className="w-4 h-4" /> Log Service
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            if (!confirm("Delete this vehicle and all its records?")) return;
                            await _deleteVehicle({ data: { id: v.id } });
                            toast.success("Vehicle deleted");
                            refreshAll();
                          }}>
                            <Trash2 className="w-4 h-4 text-primary" />
                          </Button>
                        </div>
                      </div>

                      {showReminderFor === v.id && (
                        <div className="mt-4 border-t border-border pt-4">
                          <ReminderForm
                            vehicleId={v.id}
                            onSubmit={async (payload) => {
                              await _createReminder({ data: payload });
                              toast.success("Reminder added");
                              setShowReminderFor(null);
                              refreshAll();
                            }}
                            onCancel={() => setShowReminderFor(null)}
                          />
                        </div>
                      )}

                      {showLogFor === v.id && (
                        <div className="mt-4 border-t border-border pt-4">
                          <HealthLogForm
                            vehicleId={v.id}
                            onSubmit={async (payload) => {
                              await _createHealthLog({ data: payload });
                              toast.success("Service logged");
                              setShowLogFor(null);
                              refreshAll();
                            }}
                            onCancel={() => setShowLogFor(null)}
                          />
                        </div>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        {/* REMINDERS */}
        <TabsContent value="reminders" className="mt-6 space-y-4">
          {reminders.length === 0 ? (
            <Card className="p-10 text-center bg-card/60">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="mt-4 font-bold">No reminders yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Add a reminder from any vehicle card.</p>
            </Card>
          ) : (
            <ul className="grid gap-3">
              {reminders.map(r => {
                const overdue = r.status === "pending" && r.due_date && new Date(r.due_date) < today;
                return (
                  <li key={r.id}>
                    <Card className={`p-4 bg-card/60 ${overdue ? "border-primary/40" : ""}`}>
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold">{r.title}</h4>
                            <Badge variant="outline" className="text-[10px] uppercase">{r.service_type.replace(/_/g, " ")}</Badge>
                            {r.status === "completed" && <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/40">Completed</Badge>}
                            {overdue && <Badge className="text-[10px] bg-primary/15 text-primary border-primary/40">Overdue</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r.vehicles?.nickname || `${r.vehicles?.make} ${r.vehicles?.model}`}
                            {r.due_date ? ` · Due ${new Date(r.due_date).toLocaleDateString()}` : ""}
                            {r.due_odometer_km ? ` · at ${r.due_odometer_km.toLocaleString()} km` : ""}
                          </p>
                          {r.notes && <p className="text-sm mt-1 text-muted-foreground">{r.notes}</p>}
                        </div>
                        <div className="flex gap-2">
                          {r.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={async () => {
                              await _completeReminder({ data: { id: r.id } });
                              toast.success("Marked complete");
                              refreshAll();
                            }}>
                              <CheckCircle2 className="w-4 h-4" /> Done
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={async () => {
                            await _deleteReminder({ data: { id: r.id } });
                            refreshAll();
                          }}>
                            <Trash2 className="w-4 h-4 text-primary" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="mt-6 space-y-4">
          {logs.length === 0 ? (
            <Card className="p-10 text-center bg-card/60">
              <History className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="mt-4 font-bold">No service history yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Log a service or repair from any vehicle card.</p>
            </Card>
          ) : (
            <ul className="grid gap-3">
              {logs.map(l => (
                <li key={l.id}>
                  <Card className="p-4 bg-card/60">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Wrench className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold">{l.title}</h4>
                          <Badge variant="outline" className="text-[10px] uppercase">{l.entry_type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {l.vehicles?.nickname || `${l.vehicles?.make} ${l.vehicles?.model}`} · {new Date(l.service_date).toLocaleDateString()}
                          {l.odometer_km ? ` · ${l.odometer_km.toLocaleString()} km` : ""}
                          {l.cost ? ` · ₹${Number(l.cost).toLocaleString("en-IN")}` : ""}
                        </p>
                        {l.description && <p className="text-sm mt-1 text-muted-foreground">{l.description}</p>}
                      </div>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        await _deleteHealthLog({ data: { id: l.id } });
                        refreshAll();
                      }}>
                        <Trash2 className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-10 p-6 bg-card/60">
        <div className="flex items-start gap-3">
          <ListChecks className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-bold">Email reminders</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We email you each morning when a maintenance reminder is due in the next 7 days or has gone overdue.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to="/tools">Open Tools Hub <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card className="p-5 bg-card/60 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
      </div>
    </Card>
  );
}

function VehicleForm({ onSubmit, onCancel }: {
  onSubmit: (p: {
    nickname?: string | null; make: string; model: string;
    year?: number | null; registration?: string | null;
    vehicle_type: "car" | "suv" | "bike" | "scooter" | "commercial";
    current_odometer_km: number; fuel_type?: string | null; notes?: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const [nickname, setNickname] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const [registration, setRegistration] = useState("");
  const [vehicleType, setVehicleType] = useState<"car" | "suv" | "bike" | "scooter" | "commercial">("car");
  const [odo, setOdo] = useState(0);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid sm:grid-cols-2 gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!make || !model) return toast.error("Make and model are required");
        setSaving(true);
        try {
          await onSubmit({
            nickname: nickname || null, make, model,
            year: year ? Number(year) : null,
            registration: registration || null,
            vehicle_type: vehicleType,
            current_odometer_km: Math.max(0, odo),
            fuel_type: null, notes: null,
          });
        } finally { setSaving(false); }
      }}
    >
      <div><Label>Nickname</Label><Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="My Swift" /></div>
      <div>
        <Label>Type</Label>
        <select className="w-full h-10 rounded-md bg-background border border-input px-3"
          value={vehicleType} onChange={(e) => setVehicleType(e.target.value as typeof vehicleType)}>
          <option value="car">Car</option><option value="suv">SUV</option>
          <option value="bike">Bike</option><option value="scooter">Scooter</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>
      <div><Label>Make *</Label><Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Maruti" /></div>
      <div><Label>Model *</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Swift VXi" /></div>
      <div><Label>Year</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2021" /></div>
      <div><Label>Registration</Label><Input value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="AP04 AB 1234" /></div>
      <div><Label>Current odometer (km)</Label><Input type="number" value={odo} onChange={(e) => setOdo(Number(e.target.value) || 0)} /></div>
      <div className="sm:col-span-2 flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="hero" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Vehicle
        </Button>
      </div>
    </form>
  );
}

const REMINDER_TYPES = [
  ["tyre_rotation", "Tyre Rotation"],
  ["wheel_alignment", "Wheel Alignment"],
  ["wheel_balancing", "Wheel Balancing"],
  ["tyre_replacement", "Tyre Replacement"],
  ["oil_change", "Oil Change"],
  ["brake_check", "Brake Check"],
  ["battery_check", "Battery Check"],
  ["general_service", "General Service"],
  ["insurance_renewal", "Insurance Renewal"],
  ["puc_renewal", "PUC Renewal"],
  ["other", "Other"],
] as const;

function ReminderForm({ vehicleId, onSubmit, onCancel }: {
  vehicleId: string;
  onSubmit: (p: { vehicle_id: string; service_type: typeof REMINDER_TYPES[number][0]; title: string; notes: string | null; due_date: string | null; due_odometer_km: number | null; interval_km: number | null; interval_months: number | null; }) => void;
  onCancel: () => void;
}) {
  const [serviceType, setServiceType] = useState<typeof REMINDER_TYPES[number][0]>("tyre_rotation");
  const [title, setTitle] = useState("Tyre Rotation");
  const [dueDate, setDueDate] = useState("");
  const [dueOdo, setDueOdo] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid sm:grid-cols-2 gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title) return toast.error("Title required");
        if (!dueDate && !dueOdo) return toast.error("Set a due date or odometer");
        setSaving(true);
        try {
          await onSubmit({
            vehicle_id: vehicleId,
            service_type: serviceType,
            title,
            notes: notes || null,
            due_date: dueDate || null,
            due_odometer_km: dueOdo ? Number(dueOdo) : null,
            interval_km: null, interval_months: null,
          });
        } finally { setSaving(false); }
      }}
    >
      <div>
        <Label>Service type</Label>
        <select className="w-full h-10 rounded-md bg-background border border-input px-3"
          value={serviceType}
          onChange={(e) => {
            const v = e.target.value as typeof REMINDER_TYPES[number][0];
            setServiceType(v);
            const label = REMINDER_TYPES.find(t => t[0] === v)?.[1] ?? "";
            setTitle(label);
          }}>
          {REMINDER_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
      <div><Label>Due at odometer (km)</Label><Input type="number" value={dueOdo} onChange={(e) => setDueOdo(e.target.value)} placeholder="e.g. 30000" /></div>
      <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
      <div className="sm:col-span-2 flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="hero" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Reminder
        </Button>
      </div>
    </form>
  );
}

const ENTRY_TYPES = [
  ["service", "Service"], ["repair", "Repair"], ["inspection", "Inspection"],
  ["tyre", "Tyre"], ["accident", "Accident"], ["fuel", "Fuel"], ["other", "Other"],
] as const;

function HealthLogForm({ vehicleId, onSubmit, onCancel }: {
  vehicleId: string;
  onSubmit: (p: { vehicle_id: string; entry_type: typeof ENTRY_TYPES[number][0]; title: string; description: string | null; odometer_km: number | null; cost: number | null; service_date: string; }) => void;
  onCancel: () => void;
}) {
  const [entryType, setEntryType] = useState<typeof ENTRY_TYPES[number][0]>("service");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [odo, setOdo] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid sm:grid-cols-2 gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title) return toast.error("Title required");
        setSaving(true);
        try {
          await onSubmit({
            vehicle_id: vehicleId,
            entry_type: entryType,
            title,
            description: desc || null,
            odometer_km: odo ? Number(odo) : null,
            cost: cost ? Number(cost) : null,
            service_date: date,
          });
        } finally { setSaving(false); }
      }}
    >
      <div>
        <Label>Entry type</Label>
        <select className="w-full h-10 rounded-md bg-background border border-input px-3"
          value={entryType} onChange={(e) => setEntryType(e.target.value as typeof ENTRY_TYPES[number][0])}>
          {ENTRY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Oil change at 25,000 km" /></div>
      <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div><Label>Odometer (km)</Label><Input type="number" value={odo} onChange={(e) => setOdo(e.target.value)} /></div>
      <div><Label>Cost (₹)</Label><Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
      <div className="sm:col-span-2"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
      <div className="sm:col-span-2 flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="hero" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Log
        </Button>
      </div>
    </form>
  );
}
