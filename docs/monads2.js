var fetchPost = async (postId) => {
  fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`)
    .then((response) => response.json())
    .then((json) => console.log(json));
}

var fetchUser = (userId) => {
  fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
    .then((response) => response.json())
    .then((json) => console.log(json));
}

var composeFetches = (fetch1, fetch2) => {
  fetch1(1)
    .then(post => fetch2(post.userId))
    .then(user => user.name)
}

var userNameOfPost1 = fetchAll(fetchPosts(1), fetchUser(?));