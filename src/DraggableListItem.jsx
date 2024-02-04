import * as React from 'react';
import { Draggable } from 'react-beautiful-dnd';


/* 
import makeStyles from '@material-ui/core/styles/makeStyles';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import InboxIcon from '@material-ui/icons/Inbox';
*/

import { Item } from './DraggableList';
import { Avatar, ListItem, ListItemAvatar, ListItemText, makeStyles } from '@mui/material';

/* export type DraggableListItemProps = {
  item: Item;
  index: number;
}; */

const getItemStyle = (isDragging, draggableStyle) => ({
  // styles we need to apply on draggables
  ...draggableStyle,

  ...(isDragging && {
    background: "rgb(235,235,235)"
  })
});

const DraggableListItem = ({ item, index }) => {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <ListItem
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style
          )}
        >
          <ListItemText primary={item.primary} secondary={item.secondary} />
        </ListItem>
      )}
    </Draggable>
  );
};

export default DraggableListItem;
