import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RawMaterialsTable } from "@/components/raw-materials-table";
import { AddMaterialDialog } from "@/components/add-material-dialog";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function RawMaterialsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const materials = await prisma.raw_materials.findMany({
    orderBy: { id: "desc" },
  });

  const serializedMaterials = materials.map((m) => ({
    id: m.id,
    name: m.name,
    quantity: m.quantity,
    unit: m.unit,
    price_per_kg: m.price_per_kg,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Raw Materials</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage your inventory materials</p>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/inventory/raw-materials/logs"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-yellow-50 cursor-pointer"
            style={{ borderColor: "#E8C547", color: "#E8C547" }}
          >
            Logs
          </Link>
          <AddMaterialDialog />
        </div>
      </div>

      <RawMaterialsTable initialData={serializedMaterials} />
    </div>
  );
}
