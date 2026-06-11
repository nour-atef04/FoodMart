import React, { useState } from "react";

function PaginationButton({
  children,
  active,
  disabled,
  onClick,
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="page-link"
      style={{
        color: active ? "#fff" : "#7C8B54",
        backgroundColor: active
          ? "#7C8B54"
          : hover
          ? "#dde5b6"
          : "transparent",
        border: "1px solid #7C8B54",
        transition: "0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav className="d-flex justify-content-center mt-5 mb-4">
      <ul className="pagination">
        {/* Previous */}
        <li className="page-item">
          <PaginationButton
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </PaginationButton>
        </li>

        {/* Pages */}
        {[...Array(totalPages)].map((_, i) => {
          const pageNum = i + 1;

          return (
            <li key={pageNum} className="page-item">
              <PaginationButton
                active={currentPage === pageNum}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </PaginationButton>
            </li>
          );
        })}

        {/* Next */}
        <li className="page-item">
          <PaginationButton
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </PaginationButton>
        </li>
      </ul>
    </nav>
  );
}