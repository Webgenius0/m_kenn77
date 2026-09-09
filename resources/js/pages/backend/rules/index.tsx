import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";

type Rule = { id: number; rule_type: string; icon: string | null };

export default function Index({ rules }: { rules: Rule[] }) {
    const deleteRule = (id: number) => {
        Swal.fire({ title: "Delete rule?", text: "This action cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Yes, delete it" }).then((result) => {
            if (result.isConfirmed) router.delete(`/admin/rules/${id}`);
        });
    };

    return <>
        <Head title="Rules" />
        <div className="main-content-container overflow-hidden" style={{ minHeight: "75vh" }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                <div><h3 className="mb-0">Rules</h3><p className="fs-16">Manage the rules available for properties.</p></div>
                <Link href="/admin/rules/create" className="btn btn-primary text-white">+ Add rule</Link>
            </div>
            <div className="card bg-white rounded-10 border border-white mb-4">
                <div className="p-20"><h3>Rules</h3></div>
                <div className="default-table-area mx-minus-1 table-contact-list"><div className="table-responsive"><table className="table align-middle">
                    <thead><tr><th className="fw-medium">Rule</th><th className="fw-medium">Icon</th><th className="fw-medium">Action</th></tr></thead>
                    <tbody>{rules.length > 0 ? rules.map((rule) => <tr key={rule.id}>
                        <td className="text-body">{rule.rule_type}</td>
                        <td>{rule.icon ? <img src={rule.icon} alt={rule.rule_type} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }} /> : "-"}</td>
                        <td><div className="d-flex justify-content-end" style={{ gap: "12px" }}>
                            <Link href={`/admin/rules/${rule.id}/edit`} className="bg-transparent p-0 border-0 hover-text-success" aria-label="Edit rule"><i className="material-symbols-outlined fs-16 text-primary">Edit</i></Link>
                            <button className="bg-transparent p-0 border-0 hover-text-danger" aria-label="Delete rule" onClick={() => deleteRule(rule.id)}><i className="material-symbols-outlined fs-16 text-body">delete</i></button>
                        </div></td>
                    </tr>) : <tr><td colSpan={3} className="text-center">No rules found</td></tr>}</tbody>
                </table></div></div>
            </div>
        </div>
    </>;
}
