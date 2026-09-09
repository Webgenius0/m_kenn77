import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";

interface DestinationType { id: number; name: string; }
interface Amenity { id: number; name: string; }
interface Rule { id: number; rule_type: string; icon?: string | null; }
interface RoomForm { id?: number; name: string; bed_type: string; quantity: string; image: File | null; image_url?: string | null; }
interface PropertyImage { id: number; image_path: string; is_primary: boolean; }

interface Property {
  id: number;
  destination_type_id?: number | null;
  hospitable_property_id?: string | null;
  name: string;
  title?: string | null;
  description?: string | null;
  property_type?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  price_per_night?: string | number | null;
  max_guests?: number | string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  is_active: boolean;
  is_featured: boolean;
  airbnb_property_url?: string | null;
  amenities?: { id: number; name: string; pivot?: { quantity?: number } }[];
  rules?: { id: number; rule_type: string; pivot?: { value?: string | null } }[];
  rooms?: { id: number; name: string; bed_type: string; quantity: number; image?: string | null }[];
  images?: PropertyImage[];
}

interface PropertyForm {
  destination_type_id: string;
  hospitable_property_id: string;
  name: string;
  title: string;
  description: string;
  property_type: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  price_per_night: string;
  max_guests: string;
  bedrooms: string;
  bathrooms: string;
  is_active: boolean;
  is_featured: boolean;
  airbnb_property_url: string;
  amenity_ids: number[];
  amenity_quantities: number[];
  rule_ids: number[];
  rule_values: string[];
  rooms: RoomForm[];
  images: File[];
  image_ids: number[];
  primary_image_id: string;
  primary_image_index: string;
}

export default function Edit({ property, destinationTypes, amenities, rules }: { property: Property; destinationTypes: DestinationType[]; amenities: Amenity[]; rules: Rule[] }) {
  const [imageInputKey, setImageInputKey] = useState(0);
  const initialAmenityIds = property.amenities?.map((item) => item.id) ?? [];
  const initialAmenityQuantities = property.amenities?.map((item) => item.pivot?.quantity ?? 1) ?? [];
  const initialRuleIds = property.rules?.map((item) => item.id) ?? [];
  const initialRuleValues = property.rules?.map((item) => item.pivot?.value ?? "") ?? [];
  const initialRooms = property.rooms?.map((room) => ({ id: room.id, name: room.name, bed_type: room.bed_type, quantity: String(room.quantity), image: null, image_url: room.image })) ?? [];
  const primaryImage = property.images?.find((image) => image.is_primary);

  const { data, setData, processing, errors } = useForm<PropertyForm>({
    destination_type_id: property.destination_type_id ? String(property.destination_type_id) : "",
    hospitable_property_id: property.hospitable_property_id || "",
    name: property.name,
    title: property.title || "",
    description: property.description || "",
    property_type: property.property_type || "entire_unit",
    country: property.country || "",
    state: property.state || "",
    city: property.city || "",
    address: property.address || "",
    postal_code: property.postal_code || "",
    latitude: property.latitude !== null && property.latitude !== undefined ? String(property.latitude) : "",
    longitude: property.longitude !== null && property.longitude !== undefined ? String(property.longitude) : "",
    price_per_night: property.price_per_night !== null && property.price_per_night !== undefined ? String(property.price_per_night) : "",
    max_guests: property.max_guests !== null && property.max_guests !== undefined ? String(property.max_guests) : "",
    bedrooms: property.bedrooms !== null && property.bedrooms !== undefined ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms !== null && property.bathrooms !== undefined ? String(property.bathrooms) : "",
    is_active: !!property.is_active,
    is_featured: !!property.is_featured,
    airbnb_property_url: property.airbnb_property_url || "",
    amenity_ids: initialAmenityIds,
    amenity_quantities: initialAmenityQuantities,
    rule_ids: initialRuleIds,
    rule_values: initialRuleValues,
    rooms: initialRooms,
    images: [],
    image_ids: property.images?.map((image) => image.id) ?? [],
    primary_image_id: primaryImage ? String(primaryImage.id) : "",
    primary_image_index: "",
  });

  const toggleAmenity = (id: number) => {
    const existing = data.amenity_ids.includes(id);
    const ids = existing ? data.amenity_ids.filter((item) => item !== id) : [...data.amenity_ids, id];
    const quantities = ids.map((amenityId) => {
      const index = data.amenity_ids.indexOf(amenityId);
      return data.amenity_quantities[index] ?? 1;
    });
    setData('amenity_ids', ids);
    setData('amenity_quantities', quantities);
  };

  const updateAmenityQuantity = (id: number, quantity: number) => {
    const ids = [...data.amenity_ids];
    const quantities = [...data.amenity_quantities];
    const index = ids.indexOf(id);
    if (index >= 0) {
      quantities[index] = quantity;
      setData('amenity_quantities', quantities);
    }
  };

  const toggleRule = (id: number) => {
    const existing = data.rule_ids.includes(id);
    const ids = existing ? data.rule_ids.filter((item) => item !== id) : [...data.rule_ids, id];
    const values = ids.map((ruleId) => data.rule_values[data.rule_ids.indexOf(ruleId)] ?? "");
    setData("rule_ids", ids);
    setData("rule_values", values);
  };

  const updateRuleValue = (id: number, value: string) => {
    const values = [...data.rule_values];
    const index = data.rule_ids.indexOf(id);
    if (index >= 0) {
      values[index] = value;
      setData("rule_values", values);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    router.post(`/admin/properties/${property.id}`, { ...data, _method: 'put' }, { forceFormData: true });
  };

  const addRoom = () => setData("rooms", [...data.rooms, { name: "", bed_type: "King", quantity: "1", image: null }]);
  const updateRoom = (index: number, field: keyof RoomForm, value: string | File | null) => {
    const rooms = [...data.rooms];
    rooms[index] = { ...rooms[index], [field]: value };
    setData("rooms", rooms);
  };
  const removeRoom = (index: number) => setData("rooms", data.rooms.filter((_, roomIndex) => roomIndex !== index));
  const addImages = (files: FileList | null) => {
    if (!files?.length) return;
    setData("images", [...data.images, ...Array.from(files)]);
    setData("primary_image_id", "");
    setImageInputKey((key) => key + 1);
  };
  const removeNewImage = (index: number) => {
    const images = data.images.filter((_, imageIndex) => imageIndex !== index);
    const primaryIndex = Number(data.primary_image_index);
    setData("images", images);
    setData("primary_image_index", images.length === 0 ? "" : String(primaryIndex === index ? 0 : primaryIndex > index ? primaryIndex - 1 : primaryIndex));
  };

  return (
    <>
      <Head title="Edit Property" />
      <div className="main-content-container overflow-hidden" style={{ minHeight: "75vh" }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
          <div><h3 className="mb-1">Edit property</h3><p className="fs-16 text-muted mb-0">Update the listing details, guest experience, and publishing settings.</p></div>
        </div>
        <form onSubmit={submit}>
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="mb-3"><h5 className="mb-1">Basic information</h5><p className="text-muted mb-0">Keep the property profile clear and useful.</p></div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Property Name</label>
                <input className="form-control" placeholder="e.g. Seaside villa" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                {errors.name && <div className="text-danger mt-1">{errors.name}</div>}
              </div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Title</label>
                <input className="form-control" placeholder="e.g. Bright 3-bedroom stay near the beach" value={data.title} onChange={(e) => setData('title', e.target.value)} />
              </div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Description</label>
                <textarea className="form-control" rows={4} placeholder="Describe the space, highlights, and what makes it special..." value={data.description} onChange={(e) => setData('description', e.target.value)} />
              </div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Destination Type</label>
                <select className="form-select" value={data.destination_type_id} onChange={(e) => setData('destination_type_id', e.target.value)}>
                  <option value="">Select destination type</option>
                  {destinationTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Host Property ID</label>
                <input className="form-control" placeholder="e.g. hospitable_12345" value={data.hospitable_property_id} onChange={(e) => setData('hospitable_property_id', e.target.value)} />
              </div>
            </div>

            <div className="col-lg-6">
              <div className="mb-3"><h5 className="mb-1">Location and type</h5><p className="text-muted mb-0">Help guests find and understand the property.</p></div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Property Type</label>
                <select className="form-select" value={data.property_type} onChange={(e) => setData('property_type', e.target.value)}>
                  <option value="entire_unit">Entire Unit</option>
                  <option value="private_room">Private Room</option>
                  <option value="shared_room">Shared Room</option>
                </select>
              </div>
              <div className="row g-3">
                <div className="col-md-6 mb-20">
                  <label className="label fs-16 mb-2">Country</label>
                  <input className="form-control" placeholder="e.g. United States" value={data.country} onChange={(e) => setData('country', e.target.value)} />
                </div>
                <div className="col-md-6 mb-20">
                  <label className="label fs-16 mb-2">State</label>
                  <input className="form-control" placeholder="e.g. California" value={data.state} onChange={(e) => setData('state', e.target.value)} />
                </div>
                <div className="col-md-6 mb-20">
                  <label className="label fs-16 mb-2">City</label>
                  <input className="form-control" placeholder="e.g. San Diego" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                </div>
                <div className="col-md-6 mb-20">
                  <label className="label fs-16 mb-2">Postal Code</label>
                  <input className="form-control" placeholder="e.g. 92101" value={data.postal_code} onChange={(e) => setData('postal_code', e.target.value)} />
                </div>
                <div className="col-12 mb-20">
                  <label className="label fs-16 mb-2">Address</label>
                  <input className="form-control" placeholder="Street address" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                </div>
                <div className="col-md-6 mb-20">
                  <label className="label fs-16 mb-2">Latitude</label>
                  <input className="form-control" placeholder="e.g. 32.7157" value={data.latitude} onChange={(e) => setData('latitude', e.target.value)} />
                </div>
                <div className="col-md-6 mb-20">
                  <label className="label fs-16 mb-2">Longitude</label>
                  <input className="form-control" placeholder="e.g. -117.1611" value={data.longitude} onChange={(e) => setData('longitude', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="mb-3"><h5 className="mb-1">Pricing and capacity</h5><p className="text-muted mb-0">Set the nightly rate and guest capacity.</p></div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Price Per Night</label>
                <input className="form-control" type="number" step="0.01" min="0" placeholder="e.g. 185.00" value={data.price_per_night} onChange={(e) => setData('price_per_night', e.target.value)} />
              </div>
              <div className="row g-3">
                <div className="col-md-4 mb-20">
                  <label className="label fs-16 mb-2">Max Guests</label>
                  <input className="form-control" type="number" min="1" placeholder="e.g. 8" value={data.max_guests} onChange={(e) => setData('max_guests', e.target.value)} />
                </div>
                <div className="col-md-4 mb-20">
                  <label className="label fs-16 mb-2">Bedrooms</label>
                  <input className="form-control" type="number" min="0" placeholder="e.g. 3" value={data.bedrooms} onChange={(e) => setData('bedrooms', e.target.value)} />
                </div>
                <div className="col-md-4 mb-20">
                  <label className="label fs-16 mb-2">Bathrooms</label>
                  <input className="form-control" type="number" min="0" placeholder="e.g. 2" value={data.bathrooms} onChange={(e) => setData('bathrooms', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="mb-3"><h5 className="mb-1">Publishing</h5><p className="text-muted mb-0">Control visibility and external listing details.</p></div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Airbnb Property URL</label>
                <input className="form-control" type="url" placeholder="https://www.airbnb.com/rooms/..." value={data.airbnb_property_url} onChange={(e) => setData('airbnb_property_url', e.target.value)} />
              </div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Status</label>
                <select className="form-select" value={String(data.is_active)} onChange={(e) => setData('is_active', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="mb-20">
                <label className="label fs-16 mb-2">Featured</label>
                <select className="form-select" value={String(data.is_featured)} onChange={(e) => setData('is_featured', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>

            <div className="col-12"><div className="border rounded-10 p-20 bg-light bg-opacity-50"><div className="d-flex justify-content-between align-items-center mb-3"><div><h5 className="mb-1">Rooms</h5><p className="text-muted mb-0">Update sleeping arrangements and room images.</p></div><button type="button" className="btn btn-outline-primary btn-sm" onClick={addRoom}>+ Add room</button></div>{data.rooms.map((room, index) => <div key={room.id ?? index} className="row g-3 align-items-end border-bottom pb-3 mb-3"><div className="col-md-3"><label className="label fs-16 mb-2">Room name</label><input className="form-control" placeholder="e.g. Master bedroom" value={room.name} onChange={(e) => updateRoom(index, "name", e.target.value)} /></div><div className="col-md-2"><label className="label fs-16 mb-2">Bed type</label><select className="form-select" value={room.bed_type} onChange={(e) => updateRoom(index, "bed_type", e.target.value)}><option>King</option><option>Queen</option><option>Twin</option><option>Double</option><option>Single</option></select></div><div className="col-md-2"><label className="label fs-16 mb-2">Quantity</label><input className="form-control" type="number" min="1" value={room.quantity} onChange={(e) => updateRoom(index, "quantity", e.target.value)} /></div><div className="col-md-3"><label className="label fs-16 mb-2">Replace image</label>{room.image_url && <img src={room.image_url} alt="" className="d-block mb-2" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />}<input className="form-control" type="file" accept="image/*" onChange={(e) => updateRoom(index, "image", e.target.files?.[0] || null)} /></div><div className="col-md-2"><button type="button" className="btn btn-outline-danger w-100" onClick={() => removeRoom(index)}>Remove</button></div></div>)}</div></div>
            <div className="col-12"><div className="border rounded-10 p-20 bg-light bg-opacity-50"><h5 className="mb-1">Property images</h5><p className="text-muted mb-3">Keep existing images, add new images one at a time, or change the primary image.</p><div className="row g-3 mb-3">{property.images?.map((image) => <div key={image.id} className="col-6 col-md-3"><div className="border rounded p-2 bg-white"><img src={image.image_path} alt="Property" className="w-100 rounded" style={{ height: 110, objectFit: "cover" }} /><label className="d-flex align-items-center gap-2 mt-2 small"><input type="checkbox" checked={data.image_ids.includes(image.id)} onChange={(e) => setData("image_ids", e.target.checked ? [...data.image_ids, image.id] : data.image_ids.filter((id) => id !== image.id))} /> Keep image</label><label className="d-flex align-items-center gap-2 small"><input type="radio" name="edit_primary_image" checked={data.primary_image_id === String(image.id)} onChange={() => { setData("primary_image_id", String(image.id)); setData("primary_image_index", ""); }} /> Primary</label></div></div>)}{data.images.map((image, index) => <div key={`${image.name}-${index}`} className="col-6 col-md-3"><div className="border rounded p-2 bg-white"><img src={URL.createObjectURL(image)} alt={image.name} className="w-100 rounded" style={{ height: 110, objectFit: "cover" }} /><div className="small text-truncate mt-2">{image.name}</div><label className="d-flex align-items-center gap-2 mt-1 small"><input type="radio" name="edit_primary_image" checked={data.primary_image_id === "" && Number(data.primary_image_index) === index} onChange={() => { setData("primary_image_id", ""); setData("primary_image_index", String(index)); }} /> Primary</label><button type="button" className="btn btn-link text-danger p-0 small" onClick={() => removeNewImage(index)}>Remove</button></div></div>)}</div><label className="btn btn-outline-primary mb-0" htmlFor="edit-property-images">+ Select image</label><input key={imageInputKey} id="edit-property-images" className="d-none" type="file" accept="image/*" onChange={(e) => addImages(e.target.files)} /></div></div>

            <div className="col-12">
              <div className="border rounded-10 p-20 bg-light bg-opacity-50"><h5 className="mb-1">Amenities</h5><p className="text-muted mb-3">Select what is available and add quantities where useful.</p><div className="row g-3">
                {amenities.map((amenity) => {
                  const selected = data.amenity_ids.includes(amenity.id);
                  return (
                    <div key={amenity.id} className="col-md-4 col-xl-3">
                      <div className="border rounded p-3 h-100">
                        <label className="d-flex align-items-center justify-content-between gap-2 mb-2">
                          <span>{amenity.name}</span>
                          <input type="checkbox" checked={selected} onChange={() => toggleAmenity(amenity.id)} />
                        </label>
                        {selected && (
                          <input
                            type="number"
                            className="form-control"
                            min={1}
                            value={data.amenity_quantities[data.amenity_ids.indexOf(amenity.id)] ?? 1}
                            onChange={(e) => updateAmenityQuantity(amenity.id, Number(e.target.value) || 1)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div></div>
            </div>
            <div className="col-12">
              <div className="border rounded-10 p-20 bg-light bg-opacity-50"><h5 className="mb-1">House rules</h5><p className="text-muted mb-3">Choose the rules guests should see and provide their values.</p><div className="row g-3">
                {rules.map((rule) => {
                  const selected = data.rule_ids.includes(rule.id);
                  return <div key={rule.id} className="col-md-4 col-xl-3"><div className="border rounded p-3 h-100">
                    <label className="d-flex align-items-center justify-content-between gap-2 mb-2"><span>{rule.rule_type}</span><input type="checkbox" checked={selected} onChange={() => toggleRule(rule.id)} /></label>
                    {selected && <input className="form-control" placeholder="Value, e.g. 12 pm" value={data.rule_values[data.rule_ids.indexOf(rule.id)] ?? ""} onChange={(e) => updateRuleValue(rule.id, e.target.value)} />}
                  </div></div>;
                })}
              </div></div>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4"><button type="submit" className="btn btn-primary text-white px-4" disabled={processing}>{processing ? "Saving..." : "Update property"}</button></div>
        </form>
      </div>
    </>
  );
}
