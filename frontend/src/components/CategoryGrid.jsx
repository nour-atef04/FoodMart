import React, { useState } from "react";
import vegetablesBackgroundImg from "../images/flat-lay-vegetables-white-background-food-diet-concept_169016-20321-removebg-preview.png";
import fruitsBackgroundImg from "../images/depositphotos_163941980-stock-photo-fruits-removebg-preview.png";
import dairyBackgroundImg from "../images/509943a6a88d42e385a13d71d5f59071-removebg-preview.png";
import snacksBackgroundImg from "../images/cover_image_1684944554-removebg-preview.png";
import defaultBackgroundImg from "../images/Screenshot 2024-09-11 133722.png";

import vegetablesCategory from "../images/healthiest-vegetables-mc-240229-02-5432b8.webp";
import fruitsCategory from "../images/2-2-2-3foodgroups_fruits_detailfeature.jpg";
import dairyCategory from "../images/210922092746-dairy-products-stock.jpg"
import snacksCategory from "../images/k_Photo_Recipes_2022-03-KESS-snacks_230228_ATKitchn_KESS-snacks-23_1838.jpeg"

const categories = [
  {
    categoryName: "Vegetables",
    categoryImgURL: vegetablesCategory,
    backgroundImgUrl: vegetablesBackgroundImg,
  },
  {
    categoryName: "Fruits",
    categoryImgURL: fruitsCategory,
    backgroundImgUrl: fruitsBackgroundImg,
  },
  {
    categoryName: "Dairy",
    categoryImgURL: dairyCategory,
    backgroundImgUrl: dairyBackgroundImg,
  },
  {
    categoryName: "Snacks",
    categoryImgURL: snacksCategory,
    backgroundImgUrl: snacksBackgroundImg,
  },
];

export default function CategoryGrid({ searched, filterStoreProducts}) {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [background, setBackground] = useState(defaultBackgroundImg);
  const [categorySelectedBackground, setCategorySelectedBackground] =
    useState(null);

  const imageStyle = (isHovered) => ({
    width: "140px",
    height: "140px",
    objectFit: "cover",
    borderRadius: "50%",
    transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
    transform: isHovered ? "translateY(-10px)" : "translateY(0)",
    boxShadow: isHovered ? "0px 10px 20px rgba(0, 0, 0, 0.2)" : "none",
    cursor: "pointer",
  });

  const backgroundStyle = (background) => {
    const isSmallScreen = window.innerWidth <= 990;
    return {
      backgroundColor: "#F3F1EB",
      backgroundImage: isSmallScreen ? "none" : `url(${background})`,
      backgroundRepeat: isSmallScreen ? "none" : "no-repeat",
      backgroundSize: isSmallScreen ? "none" : "contain",
      // Apply transitions only on larger screens
      transition: isSmallScreen
        ? "none"
        : "background-image 0.5s ease-in-out, opacity 0.5s ease-in-out",
    };
  };

  function handleMouseOver(index) {
    setHoveredIndex(index);
    setBackground(categories[index].backgroundImgUrl);
  }

  function handleMouseOut() {
    setHoveredIndex(-1);
    categorySelectedBackground
      ? setBackground(categorySelectedBackground)
      : setBackground(defaultBackgroundImg);
  }

  function handleClick(index) {
    filterStoreProducts(categories[index].categoryName);
    setCategorySelectedBackground(background);
  }

  return (
    <>
      {!searched ? (
        <div className="mb-5">
          <div className="p-5 text-center" style={backgroundStyle(background)}>
            <div className="container p-1">
              <div
                className="row"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {categories.map((category, index) => {
                  return (
                    <div
                      key={index}
                      className="col-lg-2 col-md-3 col-sm-4"
                      onMouseOver={() => {
                        handleMouseOver(index);
                      }}
                      onMouseOut={handleMouseOut}
                      onClick={() => {
                        handleClick(index);
                      }}
                    >
                      <img
                        style={imageStyle(hoveredIndex === index)}
                        alt={category.categoryName + "category"}
                        src={category.categoryImgURL}
                      />
                      <h4 className="fw-normal mt-2">
                        {category.categoryName}
                      </h4>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <h4 className="mt-4 mx-5" style={{ color: "#7C8B54" }}>
          <svg
            class="w-6 h-6 text-gray-800 dark:text-white me-2"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            />
          </svg>
          Results for "{searched}"
        </h4>
      )}
    </>
  );
}
