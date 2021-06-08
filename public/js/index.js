$(".scrollToTop").hide();
//Check to see if the window is top if not then display button
$(window).scroll(function() {
  if ($(this).scrollTop() > 400) {
    $('.scrollToTop').fadeIn();
}

else {
  $('.scrollToTop').fadeOut();
}
});

//Click event to scroll to top
$('.scrollToTop').click(function() {
  $('html, body').animate({
    scrollTop: 0
},800);
  return false;
});

//Navbar Appear on scroll//
$(".bg").hide();
$(window).scroll(function() {
if ($(this).scrollTop() > 50) {
    $('.bg').fadeIn();
}

else {
$('.bg').fadeOut();
}
});
