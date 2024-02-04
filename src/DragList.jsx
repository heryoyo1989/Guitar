import React, { Component, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  ListItemSecondaryAction
} from "@mui/material";
// import RootRef from "@material-ui/core/RootRef";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import InboxIcon from "@material-ui/icons/Inbox";
// import EditIcon from "@material-ui/icons/Edit";

// fake data generator
const getItems = (count) =>
  Array.from({ length: count }, (v, k) => k).map((k) => ({
    id: `item-${k}`,
    primary: `item ${k}`,
    secondary: k % 2 === 0 ? `Whatever for ${k}` : undefined
  }));

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const getItemStyle = (isDragging, draggableStyle) => ({
  // styles we need to apply on draggables
  ...draggableStyle,

  ...(isDragging && {
    background: "rgb(235,235,235)"
  })
});

const getListStyle = (isDraggingOver) => ({
  //background: isDraggingOver ? 'lightblue' : 'lightgrey',
});

const DL = (props) => {
  
  /*  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      items: this.props.items
    };
    this.onDragEnd = this.onDragEnd.bind(this);
  } */

  const [items, setItems] = useState([{id:'item-1', primary:'a', secondary:'b'}, {id:'item-2', primary:'c', secondary:'f'}]);
  getItems(10)

  //const items = [{id:1, primary:'a', secondary:'b'}, {id:2, primary:'c', secondary:'e'}]
  console.log(items);

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const newItems = reorder(
      items,
      result.source.index,
      result.destination.index
    );

    setItems(newItems);
  }

  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <div ref={provided.innerRef}>
              <List style={getListStyle(snapshot.isDraggingOver)}>
                {props.items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <ListItem
                        ContainerComponent="li"
                        ContainerProps={{ ref: provided.innerRef }}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                          snapshot.isDragging,
                          provided.draggableProps.style
                        )}
                      >
                        
                        <ListItemText
                          primary={item.primary}
                          secondary={item.secondary}
                        />
                        <ListItemSecondaryAction>
                          
                        </ListItemSecondaryAction>
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
}

export default DL;
