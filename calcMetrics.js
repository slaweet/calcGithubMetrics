const axios = require("axios");

const getPullRequestsData = (milestone, githubToken) => axios({
    url: 'https://api.github.com/graphql',
    method: 'post',
    headers: {
      'Authorization': `Bearer ${githubToken}`
    },
    data: {
      query: `
query {
  repository(owner:"LiskHQ", name:"lisk-hub") {
    milestone(number:${milestone}) {
        pullRequests(first:100) {
            edges {
                node {
                   title
                   number
                   comments(first: 50) {
                    edges {
                        node {
                            bodyText
                        }
                    }
                    
                   }
                    reviews(first: 50) {
                        edges {
                         node {
                            bodyText
                        }   
                        }
                    }
                    reviewThreads(first: 50) {
                        edges {
                         node {
                            comments(first: 50) {
                                edges {
                                    node {
                                        bodyText
                                    }
                                }
                            }
                        }   
                        }
                    }
                }
            }
        }
    }
  }
}
`
    }
  }).then(result => {
    console.log('      Design  Functional  Requirement  Coding');
    const pullRequests = result.data.data.repository.milestone.pullRequests.edges;
    pullRequests.map(pr => {
      const comments = pr.node.comments.edges;
      const reviews = pr.node.reviews.edges;
      const reviewThreads = pr.node.reviewThreads.edges;
      const reviewComments = reviewThreads.reduce((acc, thread) => [...acc, ...thread.node.comments.edges], []);

      const prCalc = [comments, reviews, reviewComments].reduce((acc, commentsArray) => {
          acc.design += calculateNumberOf(commentsArray, '🎨');
          acc.functional += calculateNumberOf(commentsArray, '🐛');
          acc.requirement += calculateNumberOf(commentsArray, '📚');
          acc.coding += calculateNumberOf(commentsArray, '💅');
          return acc;
      }, { design: 0, functional: 0, requirement:0, coding:0 });
      console.log(`${pr.node.number}    ${prCalc.design}         ${prCalc.functional}           ${prCalc.requirement}           ${prCalc.coding}`);
    });
  }, error => {
    console.log(error);
});

const calculateNumberOf = (commentsArray, emoji) => commentsArray.reduce((acc, comment) => acc + comment.node.bodyText.split(emoji).length - 1, 0);

const milestoneId = process.argv[2];
const githubToken = process.argv[3];

if (milestoneId && githubToken) {
  getPullRequestsData(milestoneId, githubToken)
} else throw new Error('You must specify two arguments: milestone ID and your Github token');

