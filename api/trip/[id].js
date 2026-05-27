import { supabase } from "../supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing trip ID" });

  try {
    const { data, error } = await supabase
      .from("trips")
      .select("trip_data, destination, created_at")
      .eq("id", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Trip not found" });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
