import { Head, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface Subscriber {
    id: number;
    email: string;
    ip_address: string | null;
    subscribed_at: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface SubscribersPagination {
    data: Subscriber[];
    links: PaginationLink[];
    from: number;
    to: number;
    total: number;
}

interface Props {
    subscribers: SubscribersPagination;
    filters: {
        search?: string;
        date?: string;
    };
}

export default function Index({ subscribers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [date, setDate] = useState(filters.date || "");

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                "/admin/newsletter",
                { search, date },
                { preserveState: true, replace: true }
            );
        }, 500);
        return () => clearTimeout(timeout);
    }, [search, date]);

    const resetFilters = () => {
        setSearch("");
        setDate("");
        router.get("/admin/newsletter");
    };

    const deleteSubscriber = (id: number, email: string) => {
        Swal.fire({
            title: "Remove Subscriber?",
            text: `${email} will be removed from the newsletter list.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, remove",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/newsletter/${id}`);
            }
        });
    };

    const exportHref = `/admin/newsletter/export/csv?${new URLSearchParams(
        Object.fromEntries(
            Object.entries({ search, date }).filter(([, v]) => v !== "")
        )
    ).toString()}`;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <>
            <Head title="Newsletter Subscribers" />

            <div
                className="main-content-container overflow-hidden"
                style={{ minHeight: "75vh" }}
            >
                <div className="row">
                    <div className="col-md-12">
                        <div className="card bg-white rounded-10 border border-white mb-4">

                            {/* Header */}
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 p-20">
                                <div>
                                    <h4 className="mb-1">Newsletter Subscribers</h4>
                                    <span className="fs-14 text-muted">
                                        {subscribers.total} total subscriber{subscribers.total !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                <a
                                    href={exportHref}
                                    className="btn btn-success text-white btn-sm text-decoration-none"
                                >
                                    <i
                                        className="material-symbols-outlined fs-16 me-1"
                                        style={{ verticalAlign: "middle" }}
                                    >
                                        download
                                    </i>
                                    Export CSV
                                </a>
                            </div>

                            {/* Filters */}
                            <div className="d-flex align-items-center gap-2 flex-wrap p-20 border-top">
                                <input
                                    className="form-control"
                                    placeholder="Search by email"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: "250px" }}
                                />

                                <input
                                    className="form-control"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{ width: "200px" }}
                                />

                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={resetFilters}
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Table */}
                            <div className="default-table-area mx-minus-1">
                                <div className="table-responsive">
                                    <table className="table align-middle w-100">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Email</th>
                                                <th>IP Address</th>
                                                <th>Subscribed At</th>
                                                <th className="text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subscribers.data.length > 0 ? (
                                                subscribers.data.map(
                                                    (subscriber, index) => (
                                                        <tr key={subscriber.id}>
                                                            <td className="text-muted fs-14">
                                                                {(subscribers.from ?? 0) + index}
                                                            </td>
                                                            <td>
                                                                <a
                                                                    href={`mailto:${subscriber.email}`}
                                                                    className="text-primary text-decoration-none"
                                                                >
                                                                    {subscriber.email}
                                                                </a>
                                                            </td>

                                                            <td className="text-muted fs-14">
                                                                {subscriber.ip_address || "—"}
                                                            </td>
                                                            <td>
                                                                {formatDate(subscriber.subscribed_at)}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex justify-content-end">
                                                                    <button
                                                                        onClick={() =>
                                                                            deleteSubscriber(
                                                                                subscriber.id,
                                                                                subscriber.email
                                                                            )
                                                                        }
                                                                        className="bg-transparent p-0 border-0"
                                                                        style={{ cursor: "pointer" }}
                                                                        title="Remove subscriber"
                                                                    >
                                                                        <i className="material-symbols-outlined fs-16 fw-normal text-danger">
                                                                            delete
                                                                        </i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="text-center py-5 text-muted"
                                                    >
                                                        No subscribers found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 pt-20 p-20">
                                    <span className="fs-14 text-muted">
                                        Showing {subscribers.from ?? 0} –{" "}
                                        {subscribers.to ?? 0} of {subscribers.total} subscribers
                                    </span>

                                    <ul className="pagination mb-0">
                                        {subscribers.links.map((link, index) => (
                                            <li
                                                key={index}
                                                className={`page-item ${link.active ? "active" : ""} ${
                                                    !link.url ? "disabled" : ""
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    className="page-link"
                                                    disabled={!link.url}
                                                    onClick={() => {
                                                        if (link.url) {
                                                            router.visit(link.url, {
                                                                preserveState: true,
                                                                preserveScroll: true,
                                                            });
                                                        }
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
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
        </>
    );
}
