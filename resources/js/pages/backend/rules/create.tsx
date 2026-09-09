import { Head, useForm } from "@inertiajs/react";
import ImageUpload from "@/pages/widget/image-upload";

type RuleForm = { rule_type: string; icon: File | null };

export default function Create() {
    const { data, setData, post, processing, errors } = useForm<RuleForm>({ rule_type: "", icon: null });
    const submit = (event: React.FormEvent) => { event.preventDefault(); post("/admin/rules", { forceFormData: true }); };

    return <><Head title="Add Rule" /><div className="card bg-white border border-white rounded-10 p-20"><h3 className="mb-20">Add rule</h3><form onSubmit={submit}><div className="row"><div className="col-lg-7"><div className="mb-20"><label className="label fs-16 mb-2">Rule Name</label><input className="form-control" placeholder="e.g: Check-in, No Smoking" value={data.rule_type} onChange={(e) => setData("rule_type", e.target.value)} />{errors.rule_type && <div className="text-danger mt-1">{errors.rule_type}</div>}</div></div><div className="col-lg-5"><ImageUpload label="Rule icon" file={data.icon} onChange={(file) => setData("icon", file)} />{errors.icon && <div className="text-danger mt-1">{errors.icon}</div>}</div></div><button type="submit" className="btn btn-primary text-white" disabled={processing}>Add rule</button></form></div></>;
}
