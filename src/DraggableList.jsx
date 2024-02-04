import * as React from 'react';
import DraggableListItem from './DraggableListItem';
import {
  DragDropContext,
  Droppable,
  OnDragEndResponder
} from 'react-beautiful-dnd';
import { List } from '@mui/material';

/* export type Item = {
    id: string;
    primary: string;
    secondary: string;
}; */

/* export type DraggableListProps = {
  items: Item[];
  onDragEnd: OnDragEndResponder;
}; */

const getListStyle = () => {}

const DraggableList = React.memo(({ items, onDragEnd }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable-list">
        {(provided, snapshot) => (
          <List style={getListStyle(snapshot.isDraggingOver)}>
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {items.map((item, index) => (
                <DraggableListItem item={item} index={index} key={item.id} />
              ))}
              {provided.placeholder}
            </div>
          </List>
          
        )}
      </Droppable>
    </DragDropContext>
  );
});

export default DraggableList;
