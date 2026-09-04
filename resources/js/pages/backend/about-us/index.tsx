import { Head, router, useForm } from "@inertiajs/react";
import EditorComponent from "@/pages/widget/editor";
import ImageUpload from "@/pages/widget/image-upload";

type AboutUs = {
    id: number;
    title: string | null;
    description: string | null;
    place_one_image: string | null;
    place_one_title: string | null;
    place_one_number: string | null;
    place_two_image: string | null;
    place_two_title: string | null;
    place_two_number: string | null;
    place_three_image: string | null;
    place_three_title: string | null;
    place_three_number: string | null;
    banner_image: string | null;
    story: string | null;
    our_mission: string | null;
    house_difference: string | null;
    our_promise: string | null;
};

type AboutUsForm = Omit<AboutUs, "id"> & {
    place_one_image: File | null;
    place_two_image: File | null;
    place_three_image: File | null;
    banner_image: File | null;
};

const textFields = [
    ["story", "Our story"],
    ["our_mission", "Our mission"],
    ["house_difference", "The Pink House difference"],
    ["our_promise", "Our promise"],
] as const;

export default function Index({ aboutUs }: { aboutUs: AboutUs }) {
    const { data, setData, processing, errors } = useForm<AboutUsForm>({
        title: aboutUs.title || "",
        description: aboutUs.description || "",
        place_one_image: null,
        place_one_title: aboutUs.place_one_title || "",
        place_one_number: aboutUs.place_one_number || "",
        place_two_image: null,
        place_two_title: aboutUs.place_two_title || "",
        place_two_number: aboutUs.place_two_number || "",
        place_three_image: null,
        place_three_title: aboutUs.place_three_title || "",
        place_three_number: aboutUs.place_three_number || "",
        banner_image: null,
        story: aboutUs.story || "",
        our_mission: aboutUs.our_mission || "",
        house_difference: aboutUs.house_difference || "",
        our_promise: aboutUs.our_promise || "",
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.post("/admin/about-us", { ...data, _method: "put" }, { forceFormData: true });
    };

    const error = (field: keyof AboutUsForm) => errors[field] && <div className="text-danger mt-1">{errors[field]}</div>;

    return (
        <>
            <Head title="About Us" />
            <div className="main-content-container overflow-hidden" style={{ minHeight: "75vh" }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                    <div>
                        <h3 className="mb-0">About Us</h3>
                        <p className="fs-16">Shape the story, values, and visual identity of your brand.</p>
                    </div>
                    <span className="text-success bg-success bg-opacity-10 fs-15 default-badge">Content editor</span>
                </div>

                <form onSubmit={submit}>
                    <div className="card bg-white rounded-10 border border-white mb-4 p-20">
                        <div className="mb-20"><h3 className="mb-1">Introduction</h3><p className="text-muted mb-0">Create the first impression visitors get from your About Us page.</p></div>
                        <div className="mb-20"><label className="label fs-16 mb-2">Headline</label><input className="form-control" value={data.title || ""} onChange={e => setData("title", e.target.value)} placeholder="A welcoming headline" />{error("title")}</div>
                        <div><label className="label fs-16 mb-2">Short introduction</label><textarea className="form-control" rows={4} value={data.description || ""} onChange={e => setData("description", e.target.value)} placeholder="A concise introduction to your company" />{error("description")}</div>
                    </div>

                    <div className="card bg-white rounded-10 border border-white mb-4 p-20">
                        <div className="mb-20"><h3 className="mb-1">Highlights</h3><p className="text-muted mb-0">Add up to three memorable facts, destinations, or places.</p></div>
                        <div className="row">
                            {([1, 2, 3] as const).map(number => {
                                const prefix = `place_${number === 1 ? "one" : number === 2 ? "two" : "three"}` as "place_one" | "place_two" | "place_three";
                                const imageField = `${prefix}_image` as keyof AboutUsForm;
                                const titleField = `${prefix}_title` as keyof AboutUsForm;
                                const numberField = `${prefix}_number` as keyof AboutUsForm;
                                const existingImage = aboutUs[imageField as keyof AboutUs] as string | null;
                                return <div className="col-lg-4 mb-20" key={prefix}>
                                    <div className="border rounded-10 p-15 h-100">
                                        <h4 className="fs-18 mb-15">Highlight {number}</h4>
                                        <ImageUpload label="Image" file={data[imageField] as File | null} imageUrl={existingImage || undefined} onChange={file => setData(imageField, file as never)} height="140px" />
                                        {error(imageField)}
                                        <label className="label fs-16 mb-2">Title</label>
                                        <input className="form-control mb-15" value={(data[titleField] as string) || ""} onChange={e => setData(titleField, e.target.value as never)} placeholder="Highlight title" />
                                        {error(titleField)}
                                        <label className="label fs-16 mb-2">Number or detail</label>
                                        <input className="form-control" value={(data[numberField] as string) || ""} onChange={e => setData(numberField, e.target.value as never)} placeholder="e.g. 12+" />
                                        {error(numberField)}
                                    </div>
                                </div>;
                            })}
                        </div>
                    </div>

                    <div className="card bg-white rounded-10 border border-white mb-4 p-20">
                        <div className="mb-20"><h3 className="mb-1">Page visuals</h3><p className="text-muted mb-0">Choose the imagery that anchors the About Us page.</p></div>
                        <div className="row">
                            <div className="col-lg-6"><ImageUpload label="Banner image" file={data.banner_image} imageUrl={aboutUs.banner_image || undefined} onChange={file => setData("banner_image", file)} height="190px" />{error("banner_image")}</div>
                        </div>
                    </div>

                    <div className="card bg-white rounded-10 border border-white mb-4 p-20">
                        <div className="mb-20"><h3 className="mb-1">Story & values</h3><p className="text-muted mb-0">Tell visitors what you believe and what makes your experience distinct.</p></div>
                        <div className="row">
                            {textFields.map(([field, label]) => <div className="col-lg-6 mb-20" key={field}>
                                <label className="label fs-16 mb-2">{label}</label>
                                <EditorComponent value={(data[field] as string) || ""} onChange={value => setData(field, value as never)} minHeight="180px" />
                                {error(field)}
                            </div>)}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary text-white mb-4" disabled={processing}>{processing ? "Saving..." : "Save About Us"}</button>
                </form>
            </div>
        </>
    );
}
