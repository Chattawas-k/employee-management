using MediatR;
using employee_management.Application.Repository.ProductCategoriesRepository;
using employee_management.Application.Repository.JobsRepository;
using employee_management.Application.Repository;

namespace employee_management.Application.Features.ProductCategories.Commands.Delete
{
    public sealed class DeleteProductCategoryHandler : IRequestHandler<DeleteProductCategoryRequest>
    {
        private readonly IProductCategoryRepository _productCategoryRepository;
        private readonly IJobRepository _jobRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteProductCategoryHandler(
            IProductCategoryRepository productCategoryRepository,
            IJobRepository jobRepository,
            IUnitOfWork unitOfWork)
        {
            _productCategoryRepository = productCategoryRepository;
            _jobRepository = jobRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task Handle(DeleteProductCategoryRequest request, CancellationToken cancellationToken)
        {
            var productCategory = await _productCategoryRepository.Get(request.Id, cancellationToken);
            if (productCategory == null || productCategory.IsDeleted)
            {
                throw new KeyNotFoundException($"Product category with ID '{request.Id}' not found.");
            }

            // Check if category is being used in any jobs
            var allJobs = await _jobRepository.GetAllJobsAsync(cancellationToken);
            var jobsUsingCategory = allJobs.Where(j => j.ProductCategoryId == request.Id && !j.IsDeleted).ToList();

            if (jobsUsingCategory.Any())
            {
                throw new InvalidOperationException(
                    $"Cannot delete product category '{productCategory.Name}' because it is being used in {jobsUsingCategory.Count} job(s).");
            }

            // Soft delete
            _productCategoryRepository.Delete(productCategory);
            await _unitOfWork.Save(cancellationToken);
        }
    }
}
