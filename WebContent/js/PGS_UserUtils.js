define([], function () {
    return {
      getCurrentUserTeam: function (userName, userList) {
        var user = userList.find(x => x.value.toLowerCase() === userName.toLowerCase());
        return user ? { team: user.team, name: user.value } : { team: "", name: userName };
      }
    };
  });
  