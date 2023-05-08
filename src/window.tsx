import clsx from 'clsx';
import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
  PropsWithChildren
} from 'react';

const options = ["File", "Edit", "Effects", "Help"];

interface WindowProps {
  id?: string;
  title: string;
  url?: string;
  startup?: boolean;
}

function Window({
  id,
  title,
  url,
  startup = false,
  children
}: PropsWithChildren<WindowProps>) {

  return (
    <div className="main-window" id={id}>
        {
            startup
            ?
            <></>
            :
            <div className="window-title-bar">
                <p>{title}</p>
                <p className="close">X</p>
            </div>
        }
      <div className="inner-window">
        {
            startup
            ?
            <></>
            :
            <div className="window-nav-bar">
                <ul>
                    {options.map((op, i) => <li key={i}>{op}</li>)}
                </ul>
            </div>
        }
        {/* {addressBar ?
          <div className="address-bar">
            <p>Address:</p>
            <div className="url">https://genre-analyzer.herokuapp.com/</div>
            <p>Links</p>
          </div>
          :
          <></>
        } */}
        <div className="content-window">
          {children}
        </div>
        {/* {props.bottomBar ? 
          <div className="bottom-bar">
            <p id={props.bottomBarId} onClick={props.bottomBarClick}>{props.bottomBarContent}</p>
          </div>
          :
          <></>
        } */}
      </div>
    </div>
  );
}

export default memo(Window);
