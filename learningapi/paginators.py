from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 100
    page_query_param = 'page'

class CoursePagination(StandardResultsSetPagination):
    page_size = 9
    page_size_query_param = 'limit'
    max_page_size = 100

class ReviewPagination(StandardResultsSetPagination):
    page_size = 5
    page_size_query_param = 'limit'
    max_page_size = 100
