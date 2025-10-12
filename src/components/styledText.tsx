import React from 'react';

const StyledText = ({ text }) => {

    return <div dangerouslySetInnerHTML={{ __html: text }} />;
};

export default StyledText;