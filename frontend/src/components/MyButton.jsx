import React, {useState} from "react";

export default function NavBarButton({
    handleClick,
    title,
    className,
    dataBsToggle,
    dataBsTarget,
    ariaLabel,
    color,
    hoverColor,
  }) {
    const [buttonBackground, setButtonBackground] = useState("transparent");
  
    function handleMouseOver() {
      setButtonBackground(hoverColor);
    }
  
    function handleMouseOut() {
      setButtonBackground("transparent");
    }
  
    return (
      <button
        className={className}
        type="button"
        data-bs-toggle={dataBsToggle}
        data-bs-target={dataBsTarget}
        aria-label={ariaLabel}
        style={{
          color: color,
          border: "1px solid",
          borderColor : color,
          background: buttonBackground,
        }}
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        {title}
      </button>
    );
  }

  //"#8B9A61"