// return true if the given id is a valid mongoDB ObjectId:
const validateObjectId = id => {
  return /^[a-f0-9]{24}$/i.test(id);
};

const checkId = id => {
  if (!(id)) return `_id required`;
  if (!(validateObjectId(id))) return `Incorrect id format.`;
};

const stampToJSON = (timeStamp) => new Date(timeStamp).toJSON();

const generalFunctions = {
  checkId: checkId,
  stampToJSON: stampToJSON
};

module.exports = generalFunctions;
