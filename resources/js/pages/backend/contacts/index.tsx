import MainLayout from "@/layouts/main-layout";
import { Head, router, Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface Contact {
    id: number;
    name: string;
    email: string;
    subject: string | null;
    phone: string | null;
    message: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ContactsPagination {
    data: Contact[];
    links: PaginationLink[];
}

interface Props {
    contacts: ContactsPagination;
    filters: {
        search?: string;
        email?: string;
        date?: string;
    };
}

export default function Index({ contacts, filters }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [email, setEmail] = useState(filters.email || "");
    const [date, setDate] = useState(filters.date || "");
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const deleteContact = (id: number) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/contacts/${id}`, {
                    onSuccess: () => {
                        setSelectedContact(null);
                    },
                });
            }
        });
    };

    const handleViewContact = (contact: Contact) => {
        setSelectedContact(contact);
    };

    const applyFilters = () => {
        router.get(
            "/admin/contacts",
            {
                search,
                email,
                date,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const resetFilters = () => {
        setSearch("");
        setEmail("");
        setDate("");
        router.get("/admin/contacts");
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                "/admin/contacts",
                {
                    search,
                    email,
                    date,
                },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        }, 500);

        return () => clearTimeout(timeout);
    }, [search, email, date]);

    return (
        <>
            <Head title="Contacts Management" />

            <div
                className="main-content-container overflow-hidden"
                style={{ minHeight: "75vh" }}
            >
                <div className="row">
                    <div className="col-md-12">
                        <div className="card bg-white rounded-10 border border-white mb-4">
                            {/* Header with Export Button */}
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 p-20">
                                <h3 className="mb-0">Contacts</h3>

                                <button
                                    className="btn btn-success text-white"
                                    onClick={() => {
                                        router.get("/admin/contacts/export/csv", {
                                            search,
                                            email,
                                            date,
                                        });
                                    }}
                                >
                                    Export CSV
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="d-flex align-items-center gap-2 flex-wrap p-20 border-top">
                                <input
                                    className="form-control"
                                    placeholder="Search by name, email, or subject"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: "250px" }}
                                />

                                <input
                                    className="form-control"
                                    placeholder="Filter by email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ width: "250px" }}
                                />

                                <input
                                    className="form-control"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{ width: "250px" }}
                                />

                                <button
                                    className="btn btn-primary text-white"
                                    onClick={applyFilters}
                                >
                                    Filter
                                </button>

                                <button
                                    className="btn btn-secondary"
                                    onClick={resetFilters}
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Table */}
                            <div className="default-table-area mx-minus-1 table-to-do-list">
                                <div className="table-responsive">
                                    <table className="table align-middle w-100">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Subject</th>
                                                <th>Phone</th>
                                                <th>Submitted Date</th>
                                                <th className="text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contacts.data.length > 0 ? (
                                                contacts.data.map((contact) => (
                                                    <tr key={contact.id}>
                                                        <td>
                                                            <h4 className="fw-medium fs-16 mb-0">
                                                                {contact.name}
                                                            </h4>
                                                        </td>
                                                        <td>{contact.email}</td>
                                                        <td>
                                                            {contact.subject ||
                                                                "-"}
                                                        </td>
                                                        <td>
                                                            {contact.phone ||
                                                                "-"}
                                                        </td>
                                                        <td>
                                                            {new Date(
                                                                contact.created_at
                                                            ).toLocaleDateString(
                                                                "en-US",
                                                                {
                                                                    year: "numeric",
                                                                    month: "short",
                                                                    day: "numeric",
                                                                }
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div
                                                                className="d-flex justify-content-end"
                                                                style={{
                                                                    gap: "12px",
                                                                }}
                                                            >
                                                                <button
                                                                    onClick={() =>
                                                                        handleViewContact(
                                                                            contact
                                                                        )
                                                                    }
                                                                    className="bg-transparent p-0 border-0 hover-text-success"
                                                                    style={{
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    <i className="material-symbols-outlined fs-16 fw-normal text-body">
                                                                        Visibility
                                                                    </i>
                                                                </button>

                                                                <button
                                                                    onClick={() =>
                                                                        deleteContact(
                                                                            contact.id
                                                                        )
                                                                    }
                                                                    className="bg-transparent p-0 border-0 hover-text-danger"
                                                                    style={{
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    <i className="material-symbols-outlined fs-16 fw-normal text-danger">
                                                                        delete
                                                                    </i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="text-center py-5"
                                                    >
                                                        No contacts found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 pt-20 p-20">
                                    <span className="fs-14 text-muted">
                                        Showing {contacts.data.length} contacts
                                    </span>

                                    <ul className="pagination mb-0">
                                        {contacts.links.map((link, index) => (
                                            <li
                                                key={index}
                                                className={`page-item ${
                                                    link.active ? "active" : ""
                                                } ${!link.url ? "disabled" : ""}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="page-link"
                                                    disabled={!link.url}
                                                    onClick={() => {
                                                        if (link.url) {
                                                            router.visit(
                                                                link.url,
                                                                {
                                                                    preserveState: true,
                                                                    preserveScroll:
                                                                        true,
                                                                }
                                                            );
                                                        }
                                                    }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Detail Modal */}
            {selectedContact && (
                <div
                    className="modal fade show d-block"
                    tabIndex={-1}
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}
                    onClick={() => setSelectedContact(null)}
                >
                    <div
                        className="modal-dialog modal-lg modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content border-0 rounded-10 shadow-lg">
                            {/* Modal Header */}
                            <div className="modal-header d-flex justify-content-between align-items-center p-20 border-bottom">
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        className="rounded-circle d-flex justify-content-center align-items-center bg-primary bg-opacity-10 text-primary"
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            minWidth: "48px",
                                        }}
                                    >
                                        <i
                                            className="material-symbols-outlined"
                                            style={{ fontSize: "26px" }}
                                        >
                                            mail
                                        </i>
                                    </div>
                                    <div>
                                        <h5 className="modal-title mb-0 fw-semibold">
                                            {selectedContact.name}
                                        </h5>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => setSelectedContact(null)}
                                />
                            </div>

                            {/* Modal Body */}
                            <div className="modal-body p-20">
                                <div className="row mb-3">
                                    <div className="col-md-6 mb-3">
                                        <label className="label fs-14 text-muted mb-2">
                                            Full Name
                                        </label>
                                        <div
                                            className="form-control d-flex align-items-center"
                                            style={{ minHeight: "48px", height: "auto" }}
                                        >
                                            {selectedContact.name}
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="label fs-14 text-muted mb-2">
                                            Subject
                                        </label>
                                        <div
                                            className="form-control d-flex align-items-center"
                                            style={{ minHeight: "48px", height: "auto" }}
                                        >
                                            {selectedContact.subject || "-"}
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="label fs-14 text-muted mb-2">
                                            Email Address
                                        </label>
                                        <div
                                            className="form-control d-flex align-items-center"
                                            style={{ minHeight: "48px", height: "auto" }}
                                        >
                                            <a
                                                href={`mailto:${selectedContact.email}`}
                                                className="text-primary text-decoration-none"
                                            >
                                                {selectedContact.email}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="label fs-14 text-muted mb-2">
                                            Phone Number
                                        </label>
                                        <div
                                            className="form-control d-flex align-items-center"
                                            style={{ minHeight: "48px", height: "auto" }}
                                        >
                                            {selectedContact.phone || "-"}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="label fs-14 text-muted mb-2">
                                        Message
                                    </label>
                                    <div
                                        className="form-control"
                                        style={{
                                            minHeight: "130px",
                                            height: "auto",
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                            padding: "12px 15px",
                                            lineHeight: "1.6",
                                        }}
                                    >
                                        {selectedContact.message}
                                    </div>
                                </div>

                                <div className="row mt-4 pt-3 border-top">
                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            <strong>Submitted On:</strong>
                                            <br />
                                            {new Date(
                                                selectedContact.created_at
                                            ).toLocaleString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="modal-footer border-top p-20">
                                <button
                                    type="button"
                                    onClick={() => setSelectedContact(null)}
                                    className="btn btn-secondary rounded-8"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
