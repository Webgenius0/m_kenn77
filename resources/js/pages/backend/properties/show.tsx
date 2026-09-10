import { Head, Link } from "@inertiajs/react";

interface DestinationType { id: number; name: string; }
interface Amenity { id: number; name: string; pivot?: { quantity?: number } }
interface Rule { id: number; rule_type: string; icon?: string | null; pivot?: { value?: string | null } }
interface Room { id: number; name: string; bed_type: string; quantity: number; image?: string | null }
interface PropertyImage { id: number; image_path: string; is_primary: boolean }

interface Property {
  id: number;
  destination_type?: DestinationType | null;
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
  amenities?: Amenity[];
  rules?: Rule[];
  rooms?: Room[];
  images?: PropertyImage[];
}

export default function Show({ property }: { property: Property }) {
  const primaryImage = property.images?.find((image) => image.is_primary)?.image_path ?? property.images?.[0]?.image_path;

  const formatCurrency = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  return (
    <>
      <Head title={`${property.name} | Property Details`} />

      <div className="main-content-container overflow-hidden">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
          <div>
            <h3 className="mb-1">Property details</h3>
            <p className="fs-16 text-muted mb-0">Manage your listing information, amenities, rules, and media.</p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <Link href={`/admin/properties/${property.id}/edit`} className="btn btn-primary text-white">
              Edit property
            </Link>
            <Link href="/admin/properties" className="btn btn-outline-secondary">
              Back to list
            </Link>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-xl-4">
            <div className="card bg-white rounded-10 border border-white shadow-sm mb-4 overflow-hidden">
              <div className="position-relative">
                <img
                  src={primaryImage || "/backend/assets/images/product1.png"}
                  alt={property.name}
                  className="w-100"
                  style={{ height: "280px", objectFit: "cover" }}
                />
                <span
                  className={`position-absolute top-0 end-0 m-3 px-3 py-1 rounded-pill fs-12 fw-medium ${property.is_active ? "bg-success text-white" : "bg-secondary text-white"}`}
                >
                  {property.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="p-20">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <h2 className="fs-28 fw-medium mb-1">{property.name}</h2>
                    <p className="text-muted mb-0">{property.slug || property.title || "Property listing"}</p>
                  </div>
                  {property.is_featured && (
                    <span className="badge bg-warning text-dark">Featured</span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="fs-14 text-muted mb-1">Nightly rate</div>
                  <div className="fs-28 fw-semibold text-primary">{formatCurrency(property.price_per_night)}</div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <div className="bg-light rounded-10 p-3 h-100">
                      <div className="fs-12 text-muted">Type</div>
                      <div className="fw-medium mt-1">{property.property_type || "—"}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded-10 p-3 h-100">
                      <div className="fs-12 text-muted">Destination</div>
                      <div className="fw-medium mt-1">{property.destination_type?.name || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-8">
            <div className="card bg-white rounded-10 border border-white shadow-sm mb-4">
              <div className="p-20 border-bottom">
                <h4 className="mb-0">Overview</h4>
              </div>

              <div className="p-20">
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="label fs-14 text-muted mb-2">Hospitable Property ID</label>
                    <div className="form-control bg-light">{property.hospitable_property_id || "—"}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="label fs-14 text-muted mb-2">Title</label>
                    <div className="form-control bg-light">{property.title || "—"}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="label fs-14 text-muted mb-2">City</label>
                    <div className="form-control bg-light">{property.city || "—"}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="label fs-14 text-muted mb-2">Country</label>
                    <div className="form-control bg-light">{property.country || "—"}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="label fs-14 text-muted mb-2">State</label>
                    <div className="form-control bg-light">{property.state || "—"}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="label fs-14 text-muted mb-2">Postal code</label>
                    <div className="form-control bg-light">{property.postal_code || "—"}</div>
                  </div>
                  <div className="col-md-12">
                    <label className="label fs-14 text-muted mb-2">Address</label>
                    <div className="form-control bg-light">{property.address || "—"}</div>
                  </div>
                  <div className="col-md-12">
                    <label className="label fs-14 text-muted mb-2">Description</label>
                    <div className="form-control bg-light" style={{ minHeight: "120px" }}>
                      {property.description || "No description added yet."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card bg-white rounded-10 border border-white shadow-sm mb-4">
                  <div className="p-20 border-bottom">
                    <h4 className="mb-0">Amenities</h4>
                  </div>
                  <div className="p-20">
                    {property.amenities && property.amenities.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {property.amenities.map((amenity) => (
                          <span key={amenity.id} className="badge bg-primary bg-opacity-10 text-primary fs-13 px-3 py-2 rounded-pill">
                            {amenity.name}
                            {amenity.pivot?.quantity ? ` × ${amenity.pivot.quantity}` : ""}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No amenities selected.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card bg-white rounded-10 border border-white shadow-sm mb-4">
                  <div className="p-20 border-bottom">
                    <h4 className="mb-0">House rules</h4>
                  </div>
                  <div className="p-20">
                    {property.rules && property.rules.length > 0 ? (
                      <ul className="list-unstyled mb-0">
                        {property.rules.map((rule) => (
                          <li key={rule.id} className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2 last-border-none">
                            <span>{rule.rule_type}</span>
                            <span className="text-muted fs-14">{rule.pivot?.value || "—"}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted mb-0">No rules configured.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-xl-6">
            <div className="card bg-white rounded-10 border border-white shadow-sm mb-4">
              <div className="p-20 border-bottom">
                <h4 className="mb-0">Rooms</h4>
              </div>
              <div className="p-20">
                {property.rooms && property.rooms.length > 0 ? (
                  <div className="row g-3">
                    {property.rooms.map((room) => (
                      <div className="col-md-6" key={room.id}>
                        <div className="border rounded-10 p-3 h-100 bg-light-40">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="mb-0 fs-16">{room.name}</h5>
                            <span className="badge bg-secondary text-white">{room.quantity} beds</span>
                          </div>
                          <div className="text-muted fs-14">{room.bed_type}</div>
                          {room.image && (
                            <img src={room.image} alt={room.name} className="mt-3 rounded-10 w-100" style={{ height: "120px", objectFit: "cover" }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mb-0">No rooms added.</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-xl-6">
            <div className="card bg-white rounded-10 border border-white shadow-sm mb-4">
              <div className="p-20 border-bottom">
                <h4 className="mb-0">Gallery</h4>
              </div>
              <div className="p-20">
                {property.images && property.images.length > 0 ? (
                  <div className="row g-3">
                    {property.images.map((image) => (
                      <div className="col-md-6" key={image.id}>
                        <div className="position-relative">
                          <img
                            src={image.image_path}
                            alt="Property gallery"
                            className="w-100 rounded-10 border"
                            style={{ height: "150px", objectFit: "cover" }}
                          />
                          {image.is_primary && (
                            <span className="position-absolute top-0 start-0 m-2 badge bg-primary">Primary</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mb-0">No images uploaded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
