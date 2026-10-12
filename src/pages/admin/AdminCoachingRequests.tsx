import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoachingRequest {
  id: string;
  coaching_name: string;
  phone: string;
  email: string;
  coaching_type: string;
  student_count: string | null;
  status: string;
  created_at: string;
}

const AdminCoachingRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CoachingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("coaching_requests" as any)
      .select("*")
      .order("created_at", { ascending: false }) as any;

    if (error) {
      console.error("Error fetching coaching requests:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from("coaching_requests" as any)
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq("id", id) as any;

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      toast({ title: `Request ${status}` });
      fetchRequests();
    }
    setUpdating(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge variant="success">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Coaching Requests</h1>
        </div>

        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No coaching requests yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coaching Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.coaching_name}</TableCell>
                      <TableCell>{r.phone}</TableCell>
                      <TableCell className="text-xs">{r.email}</TableCell>
                      <TableCell className="capitalize">{r.coaching_type}</TableCell>
                      <TableCell>{r.student_count || "—"}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              disabled={updating === r.id}
                              onClick={() => updateStatus(r.id, "approved")}
                              className="gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={updating === r.id}
                              onClick={() => updateStatus(r.id, "rejected")}
                              className="gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminCoachingRequests;
