import React from 'react';
import UnifiedRoomManagement from '../gym/RoomManagement';

const RoomManagement = ({ rooms, handleOpenRoomDialog, handleEditRoom, handleDeleteRoom }) => {
  return (
    <UnifiedRoomManagement 
      simplified={true}
      rooms={rooms}
      handleOpenRoomDialog={handleOpenRoomDialog}
      handleEditRoom={handleEditRoom}
      handleDeleteRoom={handleDeleteRoom}
    />
  );
};

export default RoomManagement;