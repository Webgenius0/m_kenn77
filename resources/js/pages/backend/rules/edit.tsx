import { Head, router, useForm } from "@inertiajs/react";
import ImageUpload from "@/pages/widget/image-upload";

type Rule = { id: number; rule_type: string; icon: string | null };
type RuleForm = { rule_type: string; icon: File | null };

export default function Edit({ rule }: { rule: Rule }) {
    const { data, setData, processing, errors } = useForm<RuleForm>({ rule_type: rule.rule_type, icon: null });
    const submit = (event: React.FormEvent) => { event.preventDefault(); router.post(`/admin/rules/${rule.id}`, { ...data, _method: "put" }, { forceFormData: true }); };

    return <><Head title="Edit Rule" /><div className="card bg-white border border-white rounded-10 p-20"><h3 className="mb-20">Edit rule</h3><form onSubmit={submit}><div className="row"><div className="col-lg-7"><div className="mb-20"><label className="label fs-16 mb-2">Rule Name</label><input className="form-control" value={data.rule_type} onChange={(e) => setData("rule_type", e.target.value)} />{errors.rule_type && <div className="text-danger mt-1">{errors.rule_type}</div>}</div></div><div className="col-lg-5"><ImageUpload label="Rule icon" file={data.icon} imageUrl={rule.icon || undefined} onChange={(file) => setData("icon", file)} />{errors.icon && <div className="text-danger mt-1">{errors.icon}</div>}</div></div><button type="submit" className="btn btn-primary text-white" disabled={processing}>Update rule</button></form></div></>;
}
