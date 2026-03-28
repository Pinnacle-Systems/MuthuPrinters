import "./Header.css";
import dp from "../../../assets/default-dp.png";
import { Bell, Search } from "lucide-react";
import Profile from "./Profile";
import logo from "../../../assets/mplogo.png";
// import { useState } from "react"
import { LogOut } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import Modal from "../../../UiComponents/Modal";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { useGetUserByIdQuery } from "../../../redux/services/UsersMasterService";
import { toast } from "react-toastify";
// import { useGetProjectQuery } from '../../../redux/services/ProjectService';
import axios from "axios";
import { PAGES_API, ROLES_API } from "../../../Api";
import AccountDetailsDropDown from "./AccountsDropDown";
import useOutsideClick from "../../../CustomHooks/handleOutsideClick";
import { useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { push } from "../../../redux/features/opentabs";
import Swal from "sweetalert2";
import Logout from "../../../Basic/components/LogoutConfirm";
import PageSearch from "./PageSearch";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const Header = ({ profile, setProfile }) => {
  const [logout, setLogout] = useState(false);
  const [hideNavBar, sethideNavBar] = useState(true);

  const navBatItemsStyle = hideNavBar ? "hidden" : "";

  const [allowedPages, setAllowedPages] = useState([]);

  const dispatch = useDispatch();

  const handleOutsideClick = () => {
    sethideNavBar(true);
  };

  const ref = useOutsideClick(handleOutsideClick);

  const toggleNavMenu = () => {
    sethideNavBar(!hideNavBar);
  };
  const id = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "userId",
  );
  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetUserByIdQuery(id);

  const retrieveAllowedPages = useCallback(() => {
    const defaultAdminRaw = secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "defaultAdmin",
    );

    let defaultAdmin = false;
    try {
      if (typeof defaultAdminRaw === "string") {
        defaultAdmin = JSON.parse(defaultAdminRaw);
      } else {
        defaultAdmin = defaultAdminRaw;
      }
    } catch (e) {
      console.error("Failed to parse defaultAdmin:", e);
      defaultAdmin = false;
    }
    if (defaultAdmin) {
      axios({
        method: "get",
        url: BASE_URL + PAGES_API,
        params: { active: true },
      }).then(
        (result) => {
          console.log("result", result.data.data);
          setAllowedPages(result.data.data);
        },
        (error) => {
          console.log(error);
          // toast.error("Server Down", { autoClose: 5000 });
          Swal.fire({
            title: "Server Down",
            icon: "error",
          });
        },
      );
    } else {
      axios({
        method: "get",
        url:
          BASE_URL +
          ROLES_API +
          `/${secureLocalStorage.getItem(
            sessionStorage.getItem("sessionId") + "userRoleId",
          )}`,
      }).then(
        (result) => {
          if (result.status === 200) {
            if (result.data.statusCode === 0) {
              setAllowedPages(
                result.data.data.RoleOnPage.filter(
                  (page) => page.page.active && page.read,
                ).map((page) => {
                  return {
                    name: page.page.name,
                    type: page.page.type,
                    link: page.page.link,
                    id: page.page.id,
                    pageGroupId: page.page.pageGroupId,
                  };
                }),
              );
            }
          } else {
            console.log(result);
          }
        },
        (error) => {
          console.log(error);
          // toast.error("Server Down", { autoClose: 5000 });
          Swal.fire({
            title: "Server Down",
            icon: "error",
          });
        },
      );
    }
  }, []);
  useEffect(retrieveAllowedPages, [retrieveAllowedPages]);
  const userName = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "username",
  );

  return (
    <div className="py-1   w-full flex justify-between items-center bg-white shadow-sm fixed z-50">
      <Modal
        isOpen={logout}
        onClose={() => {
          setLogout(false);
        }}
        widthClass={""}
      >
        <Logout setLogout={setLogout} />
      </Modal>
      <div className="w-32 ms-3">
        <img className="rounded-lg h-8" src={logo} alt="" />
      </div>
      <div className="mr-5 flex items-center space-x-5 text-sm">
        <div className="relative border rounded">
          <PageSearch pageList={allowedPages} />
        </div>
        <p>WELCOME</p> &nbsp;{" "}
        <div className="text-black">{userName?.toUpperCase()}</div>
        <div className="relative text-left">
          <button
            ref={ref}
            onClick={toggleNavMenu}
            type="button"
            className="md:bg-transparent inline-flex  text-2xl justify-end"
            id="menu-button"
            aria-expanded="true"
            aria-haspopup="true"
          >
            <img
              className="rounded-full cursor-pointer border-2 border-indigo-500"
              width={"25px"}
              src={dp}
              alt="image"
            />
          </button>
          {/* <div className="relative">
                        <div
                            className={`-ml-40 absolute  bg-gray-700 mt-2 origin-top-right rounded-md z-50 ${navBatItemsStyle}`}
                        >
                            <div className="bg-beige flex p-2 items-center rounded-lg">
                                <div className="mr-2 w-12">
                                    <img className="rounded-full" width={'30px'} height={'30px'}
                                        src={dp}
                                        alt="image" />
                                </div>
                                <div>
                                    <div className="text-sm text-black my-0 py-0">
                                        {secureLocalStorage.getItem(
                                            sessionStorage.getItem("sessionId") + "username"
                                        )}
                                    </div>
                                    <div className="text-[11px] p-0 text-gray-400 -mt-1 ">{singleData?.data?.email}</div>
                                </div>
                            </div>
                            <button className="nav-dropdown-bg  z-99 p-2 w-full" onClick={() => { dispatch(push({ id: 1000000, name: "ACCOUNT SETTINGS" })) }}>
                                <pre>ACCOUNT SETTINGS</pre>
                            </button>
                            {allowedPages.filter((page) => page.type === "AdminAccess")?.map((item, index) => (
                                <button
                                    key={index}
                                    type="link"
                                    className="nav-dropdown-bg z-99 p-2 text-start block w-full"
                                    onClick={(e) => {
                                        dispatch(push({ id: item.id, name: item.name }))
                                        secureLocalStorage.setItem(
                                            sessionStorage.getItem("sessionId") + "currentPage",
                                            item.id
                                        );
                                    }}
                                >
                                    <pre>{item.name}</pre>
                                </button>
                            ))}

                            <button className="nav-dropdown-bg z-50 p-2 w-full" onClick={() => setLogout(true)}>
                                <pre>LOG OUT</pre>

                            </button>

                        </div>
                    </div> */}
          <div className="relative">
            <div
              className={`absolute -ml-[200px] mt-2 w-64 bg-gray-400 p-2 rounded-md z-50 ${navBatItemsStyle}`}
            >
              <div className="bg-beige flex p-2 items-center rounded-lg">
                <div className="mr-2 w-12">
                  <img
                    className="rounded-full"
                    width="30"
                    height="30"
                    src={dp}
                    alt="image"
                  />
                </div>
                <div>
                  <div className="text-sm text-black">
                    {secureLocalStorage.getItem(
                      sessionStorage.getItem("sessionId") + "username",
                    )}
                  </div>
                  <div className="text-[11px]  -mt-1">
                    {singleData?.data?.email}
                  </div>
                </div>
              </div>

              <button className="nav-dropdown-bg p-2 w-full">
                <pre>ACCOUNT SETTINGS</pre>
              </button>

              {allowedPages
                .filter((page) => page.type === "AdminAccess")
                .map((item, index) => (
                  <button
                    key={index}
                    className="nav-dropdown-bg p-2 text-start w-full"
                    onClick={() => {
                      dispatch(push({ id: item.id, name: item.name }));
                      secureLocalStorage.setItem(
                        sessionStorage.getItem("sessionId") + "currentPage",
                        item.id,
                      );
                    }}
                  >
                    <pre>{item.name}</pre>
                  </button>
                ))}

              <button
                className="nav-dropdown-bg p-2 w-full"
                onClick={() => setLogout(true)}
              >
                <pre>LOG OUT</pre>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
