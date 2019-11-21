const React = require('react');
const { render, Color } = require('ink');
const Table = require('ink-table').default;

const CustomCell = ({children}) => {
  const asNumber = Number(children[1].trim());
  const color = asNumber > 3 ? { red: true } : {};
  return <Color {...color}>{children}</Color>;
};

const PrTable = ({ data }) => (
  <Table data={data} padding={0} cell={CustomCell}/>
);

const printTable = (data) => {
  render(<PrTable data={data}/>);
};

module.exports = {
  printTable,
};
