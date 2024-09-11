import React, { useState } from "react";
import vegetablesBackgroundImg from "../images/flat-lay-vegetables-white-background-food-diet-concept_169016-20321-removebg-preview.png";
import fruitsBackgroundImg from "../images/depositphotos_163941980-stock-photo-fruits-removebg-preview.png";
import dairyBackgroundImg from "../images/509943a6a88d42e385a13d71d5f59071-removebg-preview.png";
import snacksBackgroundImg from "../images/cover_image_1684944554-removebg-preview.png";
import defaultBackgroundImg from "../images/Screenshot 2024-09-11 133722.png";

const categories = [
  {
    categoryName: "Vegetables",
    categoryImgURL:
      "https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1500w,f_auto,q_auto:best/rockcms/2024-02/healthiest-vegetables-mc-240229-02-5432b8.jpg",
    backgroundImgUrl: vegetablesBackgroundImg,
  },
  {
    categoryName: "Fruits",
    categoryImgURL:
      "https://www.healthyeating.org/images/default-source/home-0.0/nutrition-topics-2.0/general-nutrition-wellness/2-2-2-3foodgroups_fruits_detailfeature.jpg?sfvrsn=64942d53_4",
    backgroundImgUrl: fruitsBackgroundImg,
  },
  {
    categoryName: "Dairy",
    categoryImgURL:
      "https://idahomilkproducts.b-cdn.net/wp-content/uploads/2021/09/processing-differences-common-dairy-products.jpg",
    backgroundImgUrl: dairyBackgroundImg,
  },
  {
    categoryName: "Snacks",
    categoryImgURL:
      "https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_1:1/k%2FPhoto%2FRecipes%2F2022-03-KESS-snacks%2F230228_ATKitchn_KESS-snacks-23_1838",
    backgroundImgUrl: snacksBackgroundImg,
  },
];

export default function CategoryGrid({ filterStoreProducts }) {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [background, setBackground] = useState(defaultBackgroundImg);
  const [categorySelectedBackground, setCategorySelectedBackground] = useState(null);

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

  const backgroundStyle = (background) => ({
    backgroundColor: "#F3F1EB",
    backgroundImage: `url(${background})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    transition: "background-image 0.5s ease-in-out, opacity 0.5s ease-in-out",
  });

  function handleMouseOver(index) {
    setHoveredIndex(index);
    setBackground(categories[index].backgroundImgUrl);
  }

  function handleMouseOut() {
    setHoveredIndex(-1);
    categorySelectedBackground ? setBackground(categorySelectedBackground) : setBackground(defaultBackgroundImg);
  }

  function handleClick(index) {
    filterStoreProducts(categories[index].categoryName);
    setCategorySelectedBackground(background);
  }

  return (
    <>
      {" "}
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
                    <h4 className="fw-normal mt-2">{category.categoryName}</h4>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
