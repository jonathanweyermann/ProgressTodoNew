import React, { Text } from 'react';
import SideNav, { NavItem, NavIcon, NavText } from '@trendmicro/react-sidenav';
import { Auth } from 'aws-amplify';

// Be sure to include styles at some point, probably during your bootstraping
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import './sidebar.css';
//import {Nav, NavItem, Navbar, NavDropdown} from 'react-bootstrap';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faThList, faCheckSquare, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
library.add(faCheckSquare)
library.add(faThList)
library.add(faTrash)
library.add(faSignOutAlt)

const signOut = () => {
 Auth.signOut()
 .then(data => console.log(data))
 .catch(err => console.log(err));
}

const breakSentence = (word) => {
  if (word.length > 21) {
    return (word.slice(0,21) + "...")
  } else {
    return word
  }
}

function Sidebar(props) {
  return (
    <React.Fragment>
      <SideNav
        onSelect={(selected) => {
          if (selected === "signout") {
            signOut()
          } else {
            props.history.push('/' + selected);
          }

        }}
        onToggle={(expanded) => {
          props.setWidth(expanded ? "wide" : "narrow")
        }}
      >
        <SideNav.Toggle />
        <SideNav.Nav defaultSelected="">
            <NavItem eventKey="">
                <NavIcon>
                    <FontAwesomeIcon icon="th-list" style={{ fontSize: '1.75em' }}/>
                </NavIcon>
                <NavText>
                    Home
                </NavText>
            </NavItem>
            <NavItem eventKey="completed">
                <NavIcon>
                    <FontAwesomeIcon icon="check-square" style={{ fontSize: '1.75em' }}/>
                </NavIcon>
                <NavText>
                    Completed Tasks
                </NavText>
            </NavItem>
            <NavItem eventKey="deleted">
                <NavIcon>
                    <FontAwesomeIcon icon="trash" style={{ fontSize: '1.75em' }}/>
                </NavIcon>
                <NavText>
                    Deleted Tasks
                </NavText>
            </NavItem>
            <NavItem eventKey="signout" style={{ position: 'absolute', bottom: 0, width: '100%', maxWidth: '240px' }}>
                <NavIcon>
                    <FontAwesomeIcon icon="sign-out-alt" style={{ fontSize: '1.75em' }}/>
                </NavIcon>
                <NavText>
                  { breakSentence("Log out " + props.currentUser.username) }
                </NavText>
            </NavItem>
        </SideNav.Nav>
      </SideNav>
    </React.Fragment>
  )
}

export default Sidebar;
